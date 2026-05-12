"""Module registry — discovers, validates, and activates ORION modules.

Every module must satisfy the :class:`~orion.contracts.base_module.BaseModule`
contract before it is registered as an active organ.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from orion.contracts.base_module import BaseModule

logger = logging.getLogger(__name__)


class ModuleRegistry:
    """Central registry of all active ORION modules (organs)."""

    def __init__(self) -> None:
        self._modules: dict[str, BaseModule] = {}

    def register(self, module: BaseModule) -> None:
        """Validate and register a module.

        Raises :class:`ValueError` if the module's contract is invalid.
        """
        errors = module.validate_contract()
        if errors:
            raise ValueError(
                f"Module '{module.name}' failed contract validation: "
                + "; ".join(errors)
            )
        self._modules[module.name] = module
        logger.info("Registered module: %s (v%s)", module.name, module.version)

    def unregister(self, name: str) -> None:
        """Remove a module from the registry."""
        if name in self._modules:
            del self._modules[name]
            logger.info("Unregistered module: %s", name)

    def get(self, name: str) -> BaseModule | None:
        """Look up a module by name."""
        return self._modules.get(name)

    def list_modules(self) -> list[dict[str, Any]]:
        """Return serializable metadata for every registered module."""
        return [
            {
                "name": m.name,
                "version": m.version,
                "description": m.description,
                "event_subscriptions": m.event_subscriptions,
                "mcp_tools": m.mcp_tools,
                "revenue_surfaces": m.revenue_surfaces,
            }
            for m in self._modules.values()
        ]

    def __len__(self) -> int:
        return len(self._modules)

    def __contains__(self, name: str) -> bool:
        return name in self._modules
