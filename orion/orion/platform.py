"""OrionPlatform — top-level bootstrap that wires spine + modules together."""

from __future__ import annotations

import logging
from typing import Any

from orion.modules.architect.module import ArchitectModule
from orion.modules.echomerce.module import EchomerceModule
from orion.modules.griefdao.module import GriefDAOModule
from orion.modules.soulprint.module import SoulprintModule
from orion.spine.config import OrionConfig
from orion.spine.event_bus import EventBus
from orion.spine.mcp_server import OrionMcpServer
from orion.spine.provider_manager import ProviderManager
from orion.spine.registry import ModuleRegistry

logger = logging.getLogger(__name__)


class OrionPlatform:
    """Wires together the thin spine and all core modules.

    Usage::

        platform = OrionPlatform(config)
        await platform.bootstrap()
    """

    def __init__(self, config: OrionConfig | None = None) -> None:
        self.config = config or OrionConfig()
        self.event_bus = EventBus()
        self.provider_manager = ProviderManager(self.config)
        self.registry = ModuleRegistry()
        self.mcp_server: OrionMcpServer | None = None
        self._bootstrapped = False

    async def bootstrap(self) -> None:
        """Initialise spine, register all core modules, wire event bus."""
        if self._bootstrapped:
            logger.info("ORION platform already bootstrapped; skipping.")
            return
        logger.info("Bootstrapping ORION platform...")

        # Core domain modules
        griefdao = GriefDAOModule(self.event_bus)
        echomerce = EchomerceModule(self.event_bus)
        soulprint = SoulprintModule(self.event_bus)

        # Meta module (needs access to registry + providers)
        architect = ArchitectModule(
            self.event_bus, self.registry, self.provider_manager
        )

        for module in [griefdao, echomerce, soulprint, architect]:
            self.registry.register(module)
            await module.initialize()

        # MCP server
        self.mcp_server = OrionMcpServer(
            self.registry, self.event_bus, self.provider_manager
        )
        self._bootstrapped = True

        logger.info(
            "ORION bootstrap complete — %d modules registered", len(self.registry)
        )

    def summary(self) -> dict[str, Any]:
        """Return a serializable platform summary."""
        return {
            "version": "1.0.0",
            "modules": self.registry.list_modules(),
            "providers": self.provider_manager.all_statuses(),
            "mcp_tools": self.mcp_server.list_tools() if self.mcp_server else [],
        }
