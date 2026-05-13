"""Architect module — the Eternal Self-Improvement Engine."""

from __future__ import annotations

import logging
from typing import Any

from orion.contracts.base_module import BaseModule
from orion.modules.architect.cycle import ImprovementCycle
from orion.spine.event_bus import Event, EventBus
from orion.spine.provider_manager import ProviderManager
from orion.spine.registry import ModuleRegistry

logger = logging.getLogger(__name__)


class ArchitectModule(BaseModule):
    """Meta-module that runs the Recursive Self-Improvement Loop."""

    def __init__(
        self,
        event_bus: EventBus,
        registry: ModuleRegistry,
        provider_manager: ProviderManager,
    ) -> None:
        super().__init__(event_bus)
        self._registry = registry
        self._provider_manager = provider_manager
        self._cycle = ImprovementCycle(event_bus, registry, provider_manager)
        self._treasury: float = 0.0
        self._vision_seeds: list[str] = []

    @property
    def name(self) -> str:
        return "architect"

    @property
    def version(self) -> str:
        return "0.1.0"

    @property
    def description(self) -> str:
        return "Recursive self-improvement engine — discovers, designs, implements, and monetises"

    @property
    def event_subscriptions(self) -> list[str]:
        return [
            "griefdao.revenue_event",
            "echomerce.revenue_event",
            "soulprint.revenue_event",
            "griefdao.estate_created",
            "echomerce.demand_detected",
            "soulprint.pattern_discovered",
        ]

    @property
    def mcp_tools(self) -> list[str]:
        return ["run_cycle", "discovery_scan", "inject_seed", "cycle_status"]

    @property
    def revenue_surfaces(self) -> list[str]:
        return ["platform_treasury"]

    async def initialize(self) -> None:
        self.subscribe_all()
        logger.info("Architect module initialised — treasury: $%.2f", self._treasury)

    async def handle_event(self, event: Event) -> None:
        logger.info("Architect received event: %s", event.name)
        if event.name.endswith(".revenue_event"):
            raw_amount = event.payload.get("amount", 0)
            try:
                amount = float(raw_amount)
            except (TypeError, ValueError):
                logger.warning(
                    "Ignoring malformed revenue amount from %s: %r",
                    event.source_module,
                    raw_amount,
                )
                return
            self._treasury += amount
            await self.emit("architect.revenue_routed", {
                "amount": amount,
                "source_module": event.source_module,
            })

    async def handle_mcp_call(self, tool: str, args: dict[str, Any]) -> Any:
        if tool == "run_cycle":
            return await self._run_cycle(args)
        if tool == "discovery_scan":
            return await self._discovery_scan(args)
        if tool == "inject_seed":
            return await self._inject_seed(args)
        if tool == "cycle_status":
            return self._cycle.status()
        return {"error": f"Unknown tool: {tool}"}

    async def _run_cycle(self, args: dict[str, Any]) -> dict[str, Any]:
        seed = args.get("vision_seed") or (
            self._vision_seeds.pop(0) if self._vision_seeds else None
        )
        return await self._cycle.run(seed=seed)

    async def _discovery_scan(self, args: dict[str, Any]) -> dict[str, Any]:
        target = args.get("target_path", ".")
        return await self._cycle.discovery_phase(target_path=target)

    async def _inject_seed(self, args: dict[str, Any]) -> dict[str, Any]:
        seed = args.get("seed", "")
        if not seed:
            return {"error": "Seed text is required"}
        self._vision_seeds.append(seed)
        return {"status": "seed_queued", "queue_depth": len(self._vision_seeds)}
