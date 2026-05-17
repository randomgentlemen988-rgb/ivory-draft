"""WebSocket connection manager keyed by game_id."""
from typing import Dict, List
from fastapi import WebSocket
import asyncio
import json


class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, game_id: str, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self.rooms.setdefault(game_id, []).append(ws)

    async def disconnect(self, game_id: str, ws: WebSocket):
        async with self._lock:
            if game_id in self.rooms and ws in self.rooms[game_id]:
                self.rooms[game_id].remove(ws)
                if not self.rooms[game_id]:
                    del self.rooms[game_id]

    async def broadcast(self, game_id: str, message: dict):
        payload = json.dumps(message, default=str)
        dead = []
        async with self._lock:
            sockets = list(self.rooms.get(game_id, []))
        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    if ws in self.rooms.get(game_id, []):
                        self.rooms[game_id].remove(ws)


manager = ConnectionManager()
