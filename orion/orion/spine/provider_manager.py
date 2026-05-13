"""Provider chain manager with automatic health-checking and fallback.

Primary: Ollama local.  Falls back through configured external providers when
the primary is unavailable.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

from orion.spine.config import OrionConfig, ProviderConfig

logger = logging.getLogger(__name__)


@dataclass
class ProviderStatus:
    """Runtime health snapshot for a single provider."""

    config: ProviderConfig
    healthy: bool = True
    last_error: str = ""
    requests_served: int = 0


class ProviderManager:
    """Manages the ordered provider chain with health checks.

    Usage::

        mgr = ProviderManager(config)
        await mgr.health_check_all()
        provider = mgr.active_provider()
        response = await mgr.generate(prompt="Hello")
    """

    def __init__(self, config: OrionConfig) -> None:
        self._providers: list[ProviderStatus] = [
            ProviderStatus(config=p) for p in config.default_providers()
        ]
        self._timeout = 30.0

    async def health_check(self, status: ProviderStatus) -> bool:
        """Ping a single provider and update its health flag."""
        url = f"{status.config.base_url}/api/tags"
        headers: dict[str, str] = {}
        if status.config.api_key:
            headers["Authorization"] = f"Bearer {status.config.api_key}"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(url, headers=headers)
                status.healthy = resp.status_code == 200
                status.last_error = "" if status.healthy else f"HTTP {resp.status_code}"
        except httpx.HTTPError as exc:
            status.healthy = False
            status.last_error = str(exc)
            logger.warning("Provider %s unhealthy: %s", status.config.name, exc)
        return status.healthy

    async def health_check_all(self) -> dict[str, bool]:
        """Run health checks on every configured provider."""
        results: dict[str, bool] = {}
        for ps in self._providers:
            results[ps.config.name] = await self.health_check(ps)
        return results

    def active_provider(self) -> ProviderConfig | None:
        """Return the highest-priority healthy provider, or ``None``."""
        for ps in self._providers:
            if ps.healthy:
                return ps.config
        return None

    def all_statuses(self) -> list[dict[str, Any]]:
        """Serializable snapshot of all provider statuses."""
        return [
            {
                "name": ps.config.name,
                "base_url": ps.config.base_url,
                "model": ps.config.model,
                "healthy": ps.healthy,
                "last_error": ps.last_error,
                "requests_served": ps.requests_served,
            }
            for ps in self._providers
        ]

    async def generate(self, prompt: str, **kwargs: Any) -> str:
        """Send a generation request to the first healthy provider.

        Falls back through the chain automatically.
        """
        for ps in self._providers:
            if not ps.healthy:
                continue
            try:
                result = await self._call_provider(ps, prompt, **kwargs)
                ps.requests_served += 1
                return result
            except Exception as exc:  # noqa: BLE001
                ps.healthy = False
                ps.last_error = str(exc)
                logger.warning(
                    "Provider %s failed, falling back: %s", ps.config.name, exc
                )
        raise RuntimeError("All providers exhausted — no healthy provider available.")

    async def _call_provider(
        self, status: ProviderStatus, prompt: str, **kwargs: Any
    ) -> str:
        """Execute a chat-completion request against a single provider."""
        url = f"{status.config.base_url}/api/chat"
        body: dict[str, Any] = {
            "model": status.config.model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            **kwargs,
        }
        headers: dict[str, str] = {}
        if status.config.api_key:
            headers["Authorization"] = f"Bearer {status.config.api_key}"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(url, json=body, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        return str(data.get("message", {}).get("content", ""))
