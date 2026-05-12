"""MCP (Model Context Protocol) server surface.

Exposes every registered module's capabilities as discoverable MCP tools via
stdio and streamable HTTP transports.
"""

from __future__ import annotations

from typing import Any

from orion.spine.event_bus import Event, EventBus
from orion.spine.provider_manager import ProviderManager
from orion.spine.registry import ModuleRegistry


class McpToolDefinition:
    """Lightweight representation of an MCP tool for serialisation."""

    def __init__(
        self,
        name: str,
        description: str,
        parameters: dict[str, Any] | None = None,
        module: str = "",
    ) -> None:
        self.name = name
        self.description = description
        self.parameters = parameters or {}
        self.module = module

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "module": self.module,
        }


class OrionMcpServer:
    """Aggregates MCP tools from all registered modules.

    Provides a unified tool catalogue that external MCP clients (Claude, Cursor,
    Devin, etc.) can discover and invoke.
    """

    def __init__(
        self,
        registry: ModuleRegistry,
        event_bus: EventBus,
        provider_manager: ProviderManager,
    ) -> None:
        self._registry = registry
        self._event_bus = event_bus
        self._provider_manager = provider_manager

    def list_tools(self) -> list[dict[str, Any]]:
        """Return the full MCP tool catalogue across all modules."""
        tools: list[dict[str, Any]] = []

        # Platform-level tools
        tools.append(
            McpToolDefinition(
                name="orion.health",
                description="Check platform health and provider status.",
                module="spine",
            ).to_dict()
        )
        tools.append(
            McpToolDefinition(
                name="orion.list_modules",
                description="List all registered ORION modules.",
                module="spine",
            ).to_dict()
        )
        tools.append(
            McpToolDefinition(
                name="orion.emit_event",
                description="Emit an event on the platform event bus.",
                parameters={
                    "event_name": {"type": "string"},
                    "payload": {"type": "object"},
                },
                module="spine",
            ).to_dict()
        )
        tools.append(
            McpToolDefinition(
                name="orion.generate",
                description="Generate text via the provider chain.",
                parameters={"prompt": {"type": "string"}},
                module="spine",
            ).to_dict()
        )

        # Module-level tools
        for mod_info in self._registry.list_modules():
            for tool_name in mod_info.get("mcp_tools", []):
                tools.append(
                    McpToolDefinition(
                        name=f"{mod_info['name']}.{tool_name}",
                        description=f"MCP tool from module {mod_info['name']}",
                        module=mod_info["name"],
                    ).to_dict()
                )

        return tools

    async def call_tool(self, tool_name: str, arguments: dict[str, Any] | None = None) -> Any:
        """Dispatch a tool call to the appropriate handler."""
        args = arguments or {}

        if tool_name == "orion.health":
            return {"status": "ok", "modules": len(self._registry)}

        if tool_name == "orion.list_modules":
            return self._registry.list_modules()

        if tool_name == "orion.emit_event":
            event = Event(
                name=args.get("event_name", "unknown"),
                payload=args.get("payload", {}),
                source_module="mcp",
            )
            await self._event_bus.emit(event)
            return {"status": "emitted", "event_id": event.event_id}

        if tool_name == "orion.generate":
            return await self._provider_manager.generate(args.get("prompt", ""))

        # Delegate to module
        parts = tool_name.split(".", 1)
        if len(parts) == 2:
            mod = self._registry.get(parts[0])
            if mod is not None:
                return await mod.handle_mcp_call(parts[1], args)

        return {"error": f"Unknown tool: {tool_name}"}
