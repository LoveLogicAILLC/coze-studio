"""FastAPI gateway — exposes platform health, module registry, and event bus.

Every module's OpenAPI surface is auto-mounted at ``/modules/{name}/``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from orion.spine.config import OrionConfig
from orion.spine.event_bus import Event, EventBus
from orion.spine.provider_manager import ProviderManager
from orion.spine.registry import ModuleRegistry

if TYPE_CHECKING:
    from orion.contracts.base_module import BaseModule


def create_app(
    config: OrionConfig,
    registry: ModuleRegistry,
    event_bus: EventBus,
    provider_manager: ProviderManager,
) -> FastAPI:
    """Build and return the ORION API gateway."""
    app = FastAPI(
        title="ORION Eternal Architect",
        version="1.0.0",
        description="Self-architecting AI-native platform — LoveLogicAI LLC",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "modules": len(registry),
            "providers": provider_manager.all_statuses(),
        }

    @app.get("/modules")
    async def list_modules() -> list[dict[str, Any]]:
        return registry.list_modules()

    @app.get("/modules/{name}")
    async def get_module(name: str) -> dict[str, Any]:
        mod = registry.get(name)
        if mod is None:
            raise HTTPException(status_code=404, detail=f"Module '{name}' not found")
        return {
            "name": mod.name,
            "version": mod.version,
            "description": mod.description,
            "mcp_tools": mod.mcp_tools,
            "event_subscriptions": mod.event_subscriptions,
            "revenue_surfaces": mod.revenue_surfaces,
        }

    def get_module_or_404(name: str) -> BaseModule:
        mod = registry.get(name)
        if mod is None:
            raise HTTPException(status_code=404, detail=f"Module '{name}' not found")
        return mod

    @app.post("/modules/architect/cycle")
    async def architect_cycle(args: dict[str, Any] | None = Body(default=None)) -> Any:
        mod = get_module_or_404("architect")
        return await mod.handle_mcp_call("run_cycle", args or {})

    @app.get("/modules/architect/status")
    async def architect_status() -> Any:
        mod = get_module_or_404("architect")
        return await mod.handle_mcp_call("cycle_status", {})

    @app.post("/modules/architect/seed")
    async def architect_seed(args: dict[str, Any] | None = Body(default=None)) -> Any:
        mod = get_module_or_404("architect")
        return await mod.handle_mcp_call("inject_seed", args or {})

    @app.post("/modules/architect/scan")
    async def architect_scan(args: dict[str, Any] | None = Body(default=None)) -> Any:
        mod = get_module_or_404("architect")
        return await mod.handle_mcp_call("discovery_scan", args or {})

    @app.post("/modules/echomerce/detect")
    async def echomerce_detect(args: dict[str, Any] | None = Body(default=None)) -> Any:
        mod = get_module_or_404("echomerce")
        return await mod.handle_mcp_call("detect_demand", args or {})

    @app.post("/modules/echomerce/offerings")
    async def echomerce_offerings(args: dict[str, Any] | None = Body(default=None)) -> Any:
        mod = get_module_or_404("echomerce")
        return await mod.handle_mcp_call("create_offering", args or {})

    @app.get("/modules/echomerce/demand-graph")
    async def echomerce_demand_graph(query: str = "") -> Any:
        mod = get_module_or_404("echomerce")
        return await mod.handle_mcp_call("query_demand_graph", {"query": query})

    @app.post("/events")
    async def post_event(event_name: str, payload: dict[str, Any] | None = None) -> dict[str, str]:
        event = Event(name=event_name, payload=payload or {}, source_module="api")
        await event_bus.emit(event)
        return {"status": "emitted", "event_id": event.event_id}

    @app.get("/events/history")
    async def event_history(event_name: str | None = None) -> list[dict[str, Any]]:
        events = event_bus.history(event_name)
        return [
            {
                "event_id": e.event_id,
                "name": e.name,
                "source_module": e.source_module,
                "timestamp": e.timestamp,
                "payload": e.payload,
            }
            for e in events
        ]

    @app.get("/providers")
    async def list_providers() -> list[dict[str, Any]]:
        return provider_manager.all_statuses()

    @app.post("/providers/health-check")
    async def run_health_checks() -> dict[str, bool]:
        return await provider_manager.health_check_all()

    return app
