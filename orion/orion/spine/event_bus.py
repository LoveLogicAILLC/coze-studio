"""Async event bus for loose-coupled module communication.

All cross-module communication flows through this bus.  Modules subscribe by
event name only (e.g. ``soulprint.decision_analyzed``), keeping coupling at
zero.
"""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

logger = logging.getLogger(__name__)

EventHandler = Callable[["Event"], Coroutine[Any, Any, None]]


@dataclass
class Event:
    """A single event flowing through the bus."""

    name: str
    payload: dict[str, Any] = field(default_factory=dict)
    source_module: str = ""
    event_id: str = field(default_factory=lambda: uuid4().hex)
    timestamp: str = field(
        default_factory=lambda: datetime.now(UTC).isoformat()
    )


class EventBus:
    """In-memory async pub/sub event bus.

    Designed for single-process execution (Mac Mini M4).  Can be swapped for
    Redis/NSQ/Kafka via the ``event_bus_backend`` config key in the future.
    """

    def __init__(self) -> None:
        self._handlers: dict[str, list[EventHandler]] = defaultdict(list)
        self._history: list[Event] = []

    def subscribe(self, event_name: str, handler: EventHandler) -> None:
        """Register *handler* for events matching *event_name*."""
        self._handlers[event_name].append(handler)
        logger.debug("Subscribed %s to '%s'", handler.__qualname__, event_name)

    def unsubscribe(self, event_name: str, handler: EventHandler) -> None:
        """Remove *handler* from *event_name* subscribers."""
        handlers = self._handlers.get(event_name, [])
        if handler in handlers:
            handlers.remove(handler)

    async def emit(self, event: Event) -> None:
        """Publish *event* to all registered handlers."""
        self._history.append(event)
        handlers = self._handlers.get(event.name, [])
        if not handlers:
            logger.debug("No handlers for event '%s'", event.name)
            return
        logger.info(
            "Emitting '%s' from '%s' to %d handler(s)",
            event.name,
            event.source_module,
            len(handlers),
        )
        results = await asyncio.gather(
            *(h(event) for h in handlers), return_exceptions=True
        )
        exceptions = [result for result in results if isinstance(result, Exception)]
        if exceptions:
            for error in exceptions:
                logger.exception(
                    "Handler failure for event '%s': %s", event.name, error
                )
            raise ExceptionGroup(
                f"{len(exceptions)} handler(s) failed for event '{event.name}'",
                exceptions,
            )

    def history(self, event_name: str | None = None) -> list[Event]:
        """Return event history, optionally filtered by name."""
        if event_name is None:
            return list(self._history)
        return [e for e in self._history if e.name == event_name]

    def clear(self) -> None:
        """Reset all subscriptions and history."""
        self._handlers.clear()
        self._history.clear()
