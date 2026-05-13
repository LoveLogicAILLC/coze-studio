"""Echomerce module — pre-demand commerce."""

from __future__ import annotations

import logging
from typing import Any
from uuid import uuid4

from orion.contracts.base_module import BaseModule
from orion.spine.event_bus import Event, EventBus

logger = logging.getLogger(__name__)


class EchomerceModule(BaseModule):
    """Detects pre-demand opportunities and creates market offerings."""

    def __init__(self, event_bus: EventBus) -> None:
        super().__init__(event_bus)
        self._demands: dict[str, dict[str, Any]] = {}
        self._offerings: dict[str, dict[str, Any]] = {}

    @property
    def name(self) -> str:
        return "echomerce"

    @property
    def version(self) -> str:
        return "0.1.0"

    @property
    def description(self) -> str:
        return "Pre-demand commerce — predictive AI-driven market creation"

    @property
    def event_subscriptions(self) -> list[str]:
        return [
            "soulprint.decision_analyzed",
            "griefdao.estate_created",
            "architect.cycle_complete",
        ]

    @property
    def mcp_tools(self) -> list[str]:
        return ["detect_demand", "create_offering", "query_demand_graph"]

    @property
    def revenue_surfaces(self) -> list[str]:
        return [
            "demand_prediction_api",
            "marketplace_transaction",
            "offering_subscription",
        ]

    async def initialize(self) -> None:
        self.subscribe_all()
        logger.info("Echomerce module initialised")

    async def handle_event(self, event: Event) -> None:
        logger.info("Echomerce received event: %s", event.name)
        if event.name == "soulprint.decision_analyzed":
            await self._ingest_signal(event.payload)
        elif event.name == "griefdao.estate_created":
            await self._ingest_signal({
                "source": "griefdao",
                "type": "estate_creation",
                **event.payload,
            })

    async def handle_mcp_call(self, tool: str, args: dict[str, Any]) -> Any:
        if tool == "detect_demand":
            return await self._detect_demand(args)
        if tool == "create_offering":
            return await self._create_offering(args)
        if tool == "query_demand_graph":
            return await self._query_demand_graph(args)
        return {"error": f"Unknown tool: {tool}"}

    async def _detect_demand(self, args: dict[str, Any]) -> dict[str, Any]:
        demand_id = uuid4().hex
        self._demands[demand_id] = {
            "signal_data": args.get("signal_data", {}),
            "market_context": args.get("market_context", ""),
            "confidence": 0.75,
            "category": "emerging",
        }
        await self.emit("echomerce.demand_detected", {
            "demand_id": demand_id,
            "category": "emerging",
            "confidence": 0.75,
        })
        return {"demand_id": demand_id, "confidence": 0.75}

    async def _create_offering(self, args: dict[str, Any]) -> dict[str, Any]:
        demand_id = args.get("demand_id", "")
        if demand_id not in self._demands:
            return {"error": f"Demand '{demand_id}' not found"}
        offering_id = uuid4().hex
        self._offerings[offering_id] = {
            "demand_id": demand_id,
            "spec": args.get("offering_spec", {}),
        }
        await self.emit("echomerce.offering_created", {
            "offering_id": offering_id,
            "demand_id": demand_id,
        })
        raw_amount = args.get("amount", 0)
        try:
            amount = float(raw_amount)
        except (TypeError, ValueError):
            amount = 0.0
        await self.emit("echomerce.revenue_event", {
            "amount": amount,
            "currency": args.get("currency", "USD"),
            "surface": "marketplace_transaction",
        })
        return {"offering_id": offering_id, "demand_id": demand_id}

    async def _query_demand_graph(self, args: dict[str, Any]) -> dict[str, Any]:
        query = args.get("query", "")
        return {
            "query": query,
            "demands": len(self._demands),
            "offerings": len(self._offerings),
            "results": list(self._demands.keys())[:10],
        }

    async def _ingest_signal(self, signal: dict[str, Any]) -> None:
        demand_id = uuid4().hex
        self._demands[demand_id] = {
            "signal_data": signal,
            "confidence": 0.5,
            "category": "cross-module",
        }
        logger.debug("Ingested signal as demand %s", demand_id)
