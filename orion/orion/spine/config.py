"""Platform-wide configuration management.

Loads from ``orion.yaml`` (or env vars) and exposes typed settings to every
spine component and module.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


@dataclass
class ProviderConfig:
    """Configuration for a single LLM provider."""

    name: str
    base_url: str
    model: str
    api_key: str = ""
    priority: int = 0
    enabled: bool = True


@dataclass
class OrionConfig:
    """Root configuration object for the ORION platform."""

    project_root: Path = field(default_factory=lambda: Path.cwd())
    host: str = "0.0.0.0"
    port: int = 8900
    debug: bool = False
    providers: list[ProviderConfig] = field(default_factory=list)
    event_bus_backend: str = "memory"
    vector_db_path: str = "./data/chromadb"
    treasury_wallet: str = ""
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_yaml(cls, path: Path | str = "orion.yaml") -> OrionConfig:
        """Load configuration from a YAML file."""
        filepath = Path(path)
        if not filepath.exists():
            return cls()
        raw: dict[str, Any] = yaml.safe_load(filepath.read_text()) or {}
        providers = [
            ProviderConfig(**p) for p in raw.pop("providers", [])
        ]
        known_fields = {f.name for f in cls.__dataclass_fields__.values()}  # type: ignore[attr-defined]
        known = {k: v for k, v in raw.items() if k in known_fields}
        extra = {k: v for k, v in raw.items() if k not in known_fields}
        return cls(providers=providers, extra=extra, **known)

    def default_providers(self) -> list[ProviderConfig]:
        """Return Ollama-local default if no providers configured."""
        if self.providers:
            return sorted(self.providers, key=lambda p: p.priority)
        return [
            ProviderConfig(
                name="ollama-local",
                base_url="http://localhost:11434",
                model="hermes3:70b",
                priority=0,
            ),
        ]
