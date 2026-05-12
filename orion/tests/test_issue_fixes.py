from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from orion.contracts.base_module import BaseModule
from orion.modules.echomerce.module import EchomerceModule
from orion.modules.griefdao.module import GriefDAOModule
from orion.modules.soulprint.module import SoulprintModule
from orion.platform import OrionPlatform
from orion.spine.api_gateway import create_app
from orion.spine.config import OrionConfig, ProviderConfig
from orion.spine.event_bus import Event, EventBus
from orion.spine.provider_manager import ProviderManager
from orion.utils.markdown import parse_contract


@pytest.mark.asyncio
async def test_event_bus_surfaces_handler_failures() -> None:
    bus = EventBus()
    called = False

    async def ok_handler(_: Event) -> None:
        nonlocal called
        called = True

    async def failing_handler(_: Event) -> None:
        raise RuntimeError("boom")

    bus.subscribe("x", ok_handler)
    bus.subscribe("x", failing_handler)

    with pytest.raises(ExceptionGroup):
        await bus.emit(Event(name="x"))
    assert called


def test_config_from_yaml_guards_types_and_extra(tmp_path: Path) -> None:
    cfg_path = tmp_path / "orion.yaml"
    cfg_path.write_text(
        """
providers: null
extra:
  nested: true
custom_value: 42
"""
    )
    cfg = OrionConfig.from_yaml(cfg_path)
    assert cfg.providers == []
    assert cfg.extra["nested"] is True
    assert cfg.extra["custom_value"] == 42

    bad_path = tmp_path / "bad.yaml"
    bad_path.write_text("providers: [")
    bad_cfg = OrionConfig.from_yaml(bad_path)
    assert bad_cfg.host == "0.0.0.0"


def test_default_providers_respects_enabled() -> None:
    cfg = OrionConfig(
        providers=[
            ProviderConfig(
                name="disabled",
                base_url="http://disabled",
                model="x",
                enabled=False,
                priority=0,
            ),
            ProviderConfig(
                name="enabled",
                base_url="http://enabled",
                model="y",
                enabled=True,
                priority=1,
            ),
        ]
    )
    assert [p.name for p in cfg.default_providers()] == ["enabled"]


def test_parse_contract_handles_malformed_yaml(tmp_path: Path) -> None:
    contract = tmp_path / "CONTRACT.md"
    contract.write_text("```yaml\n---\nmodule: [\n---\n```")
    assert parse_contract(contract) == {}


@pytest.mark.asyncio
async def test_gateway_unknown_module_404_and_contract_endpoints() -> None:
    platform = OrionPlatform()
    await platform.bootstrap()
    app = create_app(
        platform.config, platform.registry, platform.event_bus, platform.provider_manager
    )
    client = TestClient(app)

    assert client.get("/modules/does-not-exist").status_code == 404
    assert client.get("/modules/architect/status").status_code == 200
    assert client.post("/modules/architect/scan", json={}).status_code == 200
    assert client.post("/modules/echomerce/detect", json={"signal_data": {}}).status_code == 200
    assert client.get("/modules/echomerce/demand-graph").status_code == 200


@pytest.mark.asyncio
async def test_bootstrap_is_idempotent() -> None:
    platform = OrionPlatform()
    await platform.bootstrap()
    before = len(platform.event_bus._handlers["griefdao.estate_created"])
    await platform.bootstrap()
    after = len(platform.event_bus._handlers["griefdao.estate_created"])
    assert before == after


@pytest.mark.asyncio
async def test_mcp_health_includes_provider_statuses() -> None:
    platform = OrionPlatform()
    await platform.bootstrap()
    assert platform.mcp_server is not None
    health = await platform.mcp_server.call_tool("orion.health")
    assert "providers" in health
    assert isinstance(health["providers"], list)


@pytest.mark.asyncio
async def test_soulprint_handles_estate_updated_without_person_name() -> None:
    module = SoulprintModule(EventBus())
    await module.handle_event(
        Event(name="griefdao.estate_created", payload={"person_name": "Ada", "estate_id": "e1"})
    )
    await module.handle_event(Event(name="griefdao.estate_updated", payload={"estate_id": "e1"}))
    assert module._persons["Ada"]["last_estate_event"]["estate_id"] == "e1"


@pytest.mark.asyncio
async def test_soulprint_does_not_emit_pattern_for_empty_ingest() -> None:
    bus = EventBus()
    module = SoulprintModule(bus)
    emitted: list[Event] = []

    async def handler(event: Event) -> None:
        emitted.append(event)

    bus.subscribe("soulprint.pattern_discovered", handler)
    result = await module.handle_mcp_call(
        "ingest_life_data",
        {"person_id": "p1", "data_points": []},
    )
    assert result["ingested"] == 0
    assert emitted == []


@pytest.mark.asyncio
async def test_griefdao_update_estate_requires_artifact_list() -> None:
    module = GriefDAOModule(EventBus())
    created = await module.handle_mcp_call("create_legacy", {"person_name": "Ada"})
    result = await module.handle_mcp_call(
        "update_estate", {"estate_id": created["estate_id"], "artifacts": "bad"}
    )
    assert result["error"] == "artifacts must be a list"


@pytest.mark.asyncio
async def test_echomerce_emits_revenue_event() -> None:
    bus = EventBus()
    module = EchomerceModule(bus)
    revenue_events: list[Event] = []

    async def on_revenue(event: Event) -> None:
        revenue_events.append(event)

    bus.subscribe("echomerce.revenue_event", on_revenue)
    demand = await module.handle_mcp_call("detect_demand", {"signal_data": {"k": "v"}})
    await module.handle_mcp_call(
        "create_offering",
        {"demand_id": demand["demand_id"], "amount": "4.2"},
    )
    assert revenue_events
    assert revenue_events[-1].payload["amount"] == 4.2


@pytest.mark.asyncio
async def test_architect_cycle_uses_event_names_for_generated_subscriptions() -> None:
    platform = OrionPlatform()
    await platform.bootstrap()
    architect = platform.registry.get("architect")
    assert architect is not None

    result = await architect.handle_mcp_call("run_cycle", {})
    specs = result["architecture"]["specs"]
    assert specs
    subscriptions = specs[0]["contract_fields"]["event_subscriptions"]
    assert "griefdao.estate_created" in subscriptions
    assert "griefdao" not in subscriptions


class _MissingContractModule(BaseModule):
    @property
    def name(self) -> str:
        return "missing_contract_module_for_test"

    @property
    def version(self) -> str:
        return "0.1.0"

    @property
    def description(self) -> str:
        return "x"

    @property
    def event_subscriptions(self) -> list[str]:
        return []

    @property
    def mcp_tools(self) -> list[str]:
        return []

    @property
    def revenue_surfaces(self) -> list[str]:
        return []

    async def initialize(self) -> None:
        return None

    async def handle_event(self, event: Event) -> None:
        return None

    async def handle_mcp_call(self, tool: str, args: dict[str, Any]) -> Any:
        return {}


def test_missing_module_directory_fails_contract_validation() -> None:
    mod = _MissingContractModule(EventBus())
    errors = mod.validate_contract()
    assert errors
    assert "CONTRACT.md not found" in errors[0]


@pytest.mark.asyncio
async def test_provider_health_check_sends_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    class FakeResponse:
        def __init__(self) -> None:
            self.status_code = 200

    class FakeClient:
        def __init__(self, timeout: float) -> None:
            _ = timeout

        async def __aenter__(self) -> FakeClient:
            return self

        async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
            _ = (exc_type, exc, tb)

        async def get(self, url: str, headers: dict[str, str] | None = None) -> FakeResponse:
            captured["url"] = url
            captured["headers"] = headers
            return FakeResponse()

    monkeypatch.setattr("orion.spine.provider_manager.httpx.AsyncClient", FakeClient)
    manager = ProviderManager(
        OrionConfig(
            providers=[
                ProviderConfig(
                    name="p1",
                    base_url="http://provider",
                    model="m1",
                    api_key="secret",
                    enabled=True,
                )
            ]
        )
    )
    await manager.health_check(manager._providers[0])
    assert captured["headers"]["Authorization"] == "Bearer secret"
