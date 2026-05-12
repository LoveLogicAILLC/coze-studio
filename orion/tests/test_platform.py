"""Smoke tests for ORION platform bootstrap and module contracts."""

from __future__ import annotations

import pytest

from orion.platform import OrionPlatform
from orion.spine.config import OrionConfig
from orion.spine.event_bus import Event, EventBus


@pytest.fixture
def config() -> OrionConfig:
    return OrionConfig()


@pytest.fixture
def event_bus() -> EventBus:
    return EventBus()


@pytest.mark.asyncio
async def test_platform_bootstrap(config: OrionConfig) -> None:
    platform = OrionPlatform(config)
    await platform.bootstrap()
    assert len(platform.registry) == 4
    assert "griefdao" in platform.registry
    assert "echomerce" in platform.registry
    assert "soulprint" in platform.registry
    assert "architect" in platform.registry


@pytest.mark.asyncio
async def test_event_bus_pubsub(event_bus: EventBus) -> None:
    received: list[Event] = []

    async def handler(event: Event) -> None:
        received.append(event)

    event_bus.subscribe("test.event", handler)
    await event_bus.emit(Event(name="test.event", payload={"key": "value"}))
    assert len(received) == 1
    assert received[0].payload["key"] == "value"


@pytest.mark.asyncio
async def test_event_bus_history(event_bus: EventBus) -> None:
    await event_bus.emit(Event(name="a.event"))
    await event_bus.emit(Event(name="b.event"))
    assert len(event_bus.history()) == 2
    assert len(event_bus.history("a.event")) == 1


@pytest.mark.asyncio
async def test_module_contract_validation(config: OrionConfig) -> None:
    platform = OrionPlatform(config)
    await platform.bootstrap()
    for info in platform.registry.list_modules():
        mod = platform.registry.get(info["name"])
        assert mod is not None
        errors = mod.validate_contract()
        assert errors == [], f"Module {info['name']} failed: {errors}"


@pytest.mark.asyncio
async def test_mcp_server_tools(config: OrionConfig) -> None:
    platform = OrionPlatform(config)
    await platform.bootstrap()
    assert platform.mcp_server is not None
    tools = platform.mcp_server.list_tools()
    tool_names = [t["name"] for t in tools]
    assert "orion.health" in tool_names
    assert "orion.list_modules" in tool_names
    assert "orion.emit_event" in tool_names
    assert "orion.generate" in tool_names


@pytest.mark.asyncio
async def test_architect_cycle(config: OrionConfig) -> None:
    platform = OrionPlatform(config)
    await platform.bootstrap()
    arch = platform.registry.get("architect")
    assert arch is not None
    result = await arch.handle_mcp_call("run_cycle", {})
    assert "cycle_id" in result
    assert "discovery" in result
    assert "architecture" in result
    assert "implementation" in result
    assert "monetisation" in result


@pytest.mark.asyncio
async def test_griefdao_create_legacy(config: OrionConfig) -> None:
    platform = OrionPlatform(config)
    await platform.bootstrap()
    mod = platform.registry.get("griefdao")
    assert mod is not None
    result = await mod.handle_mcp_call("create_legacy", {"person_name": "Test Person"})
    assert "estate_id" in result
    assert result["person_name"] == "Test Person"


@pytest.mark.asyncio
async def test_cross_module_event_flow(config: OrionConfig) -> None:
    """Verify events flow between modules via the shared bus."""
    platform = OrionPlatform(config)
    await platform.bootstrap()

    griefdao = platform.registry.get("griefdao")
    assert griefdao is not None
    await griefdao.handle_mcp_call(
        "create_legacy", {"person_name": "Cross-Module Test"}
    )

    history = platform.event_bus.history("griefdao.estate_created")
    assert len(history) >= 1
    assert history[-1].payload["person_name"] == "Cross-Module Test"
