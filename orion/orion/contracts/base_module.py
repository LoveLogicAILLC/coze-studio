"""BaseModule contract — every ORION organ must satisfy this interface.

Modules that fail :meth:`validate_contract` cannot be registered in the
:class:`~orion.spine.registry.ModuleRegistry`.
"""

from __future__ import annotations

import abc
from pathlib import Path
from typing import Any

from orion.spine.event_bus import Event, EventBus


class BaseModule(abc.ABC):
    """Abstract base for all ORION modules (organs).

    Subclasses **must** implement every abstract method and property.  The
    registry calls :meth:`validate_contract` before activation.
    """

    def __init__(self, event_bus: EventBus) -> None:
        self._event_bus = event_bus

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------
    @property
    @abc.abstractmethod
    def name(self) -> str:
        """Machine-readable module name (e.g. ``griefdao``)."""

    @property
    @abc.abstractmethod
    def version(self) -> str:
        """Semantic version of this module."""

    @property
    @abc.abstractmethod
    def description(self) -> str:
        """One-line human-readable description."""

    # ------------------------------------------------------------------
    # Interface declarations
    # ------------------------------------------------------------------
    @property
    @abc.abstractmethod
    def event_subscriptions(self) -> list[str]:
        """Event names this module subscribes to."""

    @property
    @abc.abstractmethod
    def mcp_tools(self) -> list[str]:
        """MCP tool names exposed by this module."""

    @property
    @abc.abstractmethod
    def revenue_surfaces(self) -> list[str]:
        """Revenue-generating endpoints or capabilities."""

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    @abc.abstractmethod
    async def initialize(self) -> None:
        """Called once when the module is registered and activated."""

    @abc.abstractmethod
    async def handle_event(self, event: Event) -> None:
        """Process an incoming event from the bus."""

    @abc.abstractmethod
    async def handle_mcp_call(self, tool: str, args: dict[str, Any]) -> Any:
        """Handle an MCP tool invocation."""

    # ------------------------------------------------------------------
    # Contract validation
    # ------------------------------------------------------------------
    def validate_contract(self) -> list[str]:
        """Return a list of validation errors (empty = valid)."""
        errors: list[str] = []
        if not self.name:
            errors.append("Module name is required.")
        if not self.version:
            errors.append("Module version is required.")
        if not self.description:
            errors.append("Module description is required.")

        contract_path = self._contract_path()
        if contract_path is not None and not contract_path.exists():
            errors.append(f"CONTRACT.md not found at {contract_path}")

        return errors

    def _contract_path(self) -> Path | None:
        """Resolve the expected CONTRACT.md path for this module."""
        mod_file = Path(__file__).resolve()
        # Walk up to orion/orion/contracts -> orion/orion -> look for modules/{name}
        modules_dir = mod_file.parent.parent / "modules" / self.name
        if modules_dir.is_dir():
            return modules_dir / "CONTRACT.md"
        return None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    async def emit(self, event_name: str, payload: dict[str, Any] | None = None) -> None:
        """Convenience: emit an event sourced from this module."""
        event = Event(
            name=event_name,
            payload=payload or {},
            source_module=self.name,
        )
        await self._event_bus.emit(event)

    def subscribe_all(self) -> None:
        """Subscribe this module to all declared event subscriptions."""
        for event_name in self.event_subscriptions:
            self._event_bus.subscribe(event_name, self.handle_event)
