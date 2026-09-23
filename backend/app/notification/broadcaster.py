import asyncio
from typing import Any


class NotificationBroadcaster:
    """Thread-safe in-memory pub/sub broadcaster for real-time user notification streams."""

    def __init__(self, max_queue_size: int = 100) -> None:
        self._connections: dict[int, set[asyncio.Queue[dict[str, Any]]]] = {}
        self._max_queue_size = max_queue_size

    def connect(self, user_id: int) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(
            maxsize=self._max_queue_size
        )
        if user_id not in self._connections:
            self._connections[user_id] = set()
        self._connections[user_id].add(queue)
        return queue

    def disconnect(
        self, user_id: int, queue: asyncio.Queue[dict[str, Any]]
    ) -> None:
        if user_id in self._connections:
            self._connections[user_id].discard(queue)
            if not self._connections[user_id]:
                del self._connections[user_id]

    def publish(self, user_id: int, event_data: dict[str, Any]) -> None:
        queues = self._connections.get(user_id)
        if not queues:
            return
        for q in list(queues):
            try:
                q.put_nowait(event_data)
            except asyncio.QueueFull:
                try:
                    q.get_nowait()
                    q.put_nowait(event_data)
                except Exception:
                    pass

    def get_subscriber_count(self, user_id: int | None = None) -> int:
        if user_id is not None:
            return len(self._connections.get(user_id, set()))
        return sum(len(qs) for qs in self._connections.values())


notification_broadcaster = NotificationBroadcaster()
