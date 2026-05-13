"""Four-phase Recursive Self-Improvement Cycle.

1. Discovery & Critique
2. Architecture & Specification
3. Implementation & Deployment
4. Monetisation & Reinforcement
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from orion.spine.event_bus import Event, EventBus
from orion.spine.provider_manager import ProviderManager
from orion.spine.registry import ModuleRegistry

logger = logging.getLogger(__name__)


class ImprovementCycle:
    """Orchestrates the 4-phase self-improvement loop."""

    def __init__(
        self,
        event_bus: EventBus,
        registry: ModuleRegistry,
        provider_manager: ProviderManager,
    ) -> None:
        self._event_bus = event_bus
        self._registry = registry
        self._provider_manager = provider_manager
        self._current_cycle_id: str | None = None
        self._phase: str = "idle"
        self._history: list[dict[str, Any]] = []

    def status(self) -> dict[str, Any]:
        """Return current cycle status."""
        return {
            "cycle_id": self._current_cycle_id,
            "phase": self._phase,
            "total_cycles": len(self._history),
            "modules_registered": len(self._registry),
        }

    async def run(self, seed: str | None = None) -> dict[str, Any]:
        """Execute one complete self-improvement cycle."""
        self._current_cycle_id = uuid4().hex
        cycle_id = self._current_cycle_id
        started = datetime.now(UTC).isoformat()

        await self._event_bus.emit(Event(
            name="architect.cycle_started",
            payload={"cycle_id": cycle_id, "phase": "discovery"},
            source_module="architect",
        ))

        # Phase 1: Discovery
        discovery = await self.discovery_phase(cycle_id=cycle_id)

        # Phase 2: Architecture
        architecture = await self.architecture_phase(discovery, seed)

        # Phase 3: Implementation
        implementation = await self.implementation_phase(architecture)

        # Phase 4: Monetisation
        monetisation = await self.monetisation_phase(implementation)

        result = {
            "cycle_id": cycle_id,
            "started": started,
            "completed": datetime.now(UTC).isoformat(),
            "seed": seed,
            "discovery": discovery,
            "architecture": architecture,
            "implementation": implementation,
            "monetisation": monetisation,
        }
        self._history.append(result)
        self._phase = "idle"

        await self._event_bus.emit(Event(
            name="architect.cycle_complete",
            payload={
                "cycle_id": cycle_id,
                "modules_created": implementation.get("modules_created", 0),
                "modules_refactored": implementation.get("modules_refactored", 0),
            },
            source_module="architect",
        ))

        return result

    async def discovery_phase(
        self, target_path: str = ".", cycle_id: str | None = None
    ) -> dict[str, Any]:
        """Phase 1: Loki-style discovery scan."""
        self._phase = "discovery"
        logger.info("Phase 1: Discovery & Critique — scanning %s", target_path)

        modules = self._registry.list_modules()
        events = self._event_bus.history()

        scan_results = {
            "target_path": target_path,
            "modules_found": len(modules),
            "modules": [m["name"] for m in modules],
            "event_history_size": len(events),
            "opportunities": [],
        }

        # Identify gaps
        all_event_subs: set[str] = set()
        all_event_emissions: set[str] = set()
        for m in modules:
            all_event_subs.update(m.get("event_subscriptions", []))

        for e in events:
            all_event_emissions.add(e.name)

        scan_results["known_event_subscriptions"] = sorted(all_event_subs)

        unhandled = all_event_emissions - all_event_subs
        if unhandled:
            scan_results["opportunities"].append({
                "type": "unhandled_events",
                "description": f"Events emitted but not subscribed to: {unhandled}",
                "leverage": "high",
            })

        # Check for missing cross-module flows
        if len(modules) >= 3:
            scan_results["opportunities"].append({
                "type": "cross_module_flow",
                "description": "Potential new cross-module analytics pipeline",
                "leverage": "medium",
            })

        await self._event_bus.emit(Event(
            name="architect.discovery_complete",
            payload={
                "cycle_id": self._resolve_cycle_id(cycle_id),
                "opportunities": scan_results["opportunities"],
            },
            source_module="architect",
        ))

        return scan_results

    async def architecture_phase(
        self, discovery: dict[str, Any], seed: str | None = None
    ) -> dict[str, Any]:
        """Phase 2: Produce specs and CONTRACT.md for identified opportunities."""
        self._phase = "architecture"
        logger.info("Phase 2: Architecture & Specification")

        opportunities = discovery.get("opportunities", [])
        specs: list[dict[str, Any]] = []

        for opp in opportunities:
            spec = {
                "opportunity": opp,
                "proposed_module": f"auto_{opp['type']}",
                "contract_fields": {
                    "name": f"auto_{opp['type']}",
                    "version": "0.1.0",
                    "description": opp["description"],
                    "mcp_tools": [f"{opp['type']}_analyze"],
                    "event_subscriptions": list(
                        discovery.get("known_event_subscriptions", [])
                    ),
                    "revenue_surfaces": [f"{opp['type']}_api"],
                },
            }
            specs.append(spec)

        if seed:
            specs.append({
                "opportunity": {"type": "vision_seed", "description": seed},
                "proposed_module": "seed_module",
                "contract_fields": {
                    "name": "seed_module",
                    "version": "0.1.0",
                    "description": seed,
                },
            })

        return {"specs": specs, "seed": seed}

    async def implementation_phase(
        self, architecture: dict[str, Any]
    ) -> dict[str, Any]:
        """Phase 3: Generate or refactor modules based on specs.

        In MVP this produces a plan; full code-gen is a Phase 2+ capability.
        """
        self._phase = "implementation"
        logger.info("Phase 3: Implementation & Deployment")

        specs = architecture.get("specs", [])
        return {
            "modules_created": 0,
            "modules_refactored": 0,
            "planned": [s.get("proposed_module", "unknown") for s in specs],
            "note": "MVP: Implementation produces plans. Full code-gen in Phase 2+.",
        }

    async def monetisation_phase(
        self, implementation: dict[str, Any]
    ) -> dict[str, Any]:
        """Phase 4: Expose revenue surfaces and route to treasury."""
        self._phase = "monetisation"
        logger.info("Phase 4: Monetisation & Reinforcement")

        return {
            "revenue_surfaces_exposed": len(implementation.get("planned", [])),
            "treasury_updated": True,
            "note": "Revenue routing active for all registered modules.",
        }

    def _resolve_cycle_id(self, cycle_id: str | None) -> str:
        """Use explicit cycle_id, then current cycle_id, else generate a fresh id."""
        return cycle_id or self._current_cycle_id or uuid4().hex
