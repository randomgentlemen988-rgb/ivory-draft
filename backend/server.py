"""Ivory Draft - FastAPI backend."""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from auth import router as auth_router
from game_routes import router as game_router
from ws_manager import manager
from prompts_seed import get_seed_prompts
from models import Prompt

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ivory-draft")


@asynccontextmanager
async def lifespan(app: FastAPI):
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    app.state.client = client
    app.state.db = db

    # Indexes
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.games.create_index("game_id", unique=True)
    await db.games.create_index("join_code", unique=True)
    await db.prompts.create_index("prompt_id", unique=True)
    await db.submissions.create_index("submission_id", unique=True)
    await db.submissions.create_index([("game_id", 1), ("round_number", 1), ("user_id", 1)])
    await db.scores.create_index("score_id", unique=True)
    await db.scores.create_index([("game_id", 1), ("round_number", 1), ("scored_by", 1), ("submission_id", 1)])

    # Seed prompts if empty
    count = await db.prompts.count_documents({})
    if count == 0:
        seed = get_seed_prompts()
        docs = []
        for s in seed:
            p = Prompt(**s)
            d = p.model_dump()
            d["created_at"] = d["created_at"].isoformat()
            docs.append(d)
        if docs:
            await db.prompts.insert_many(docs)
            logger.info(f"Seeded {len(docs)} prompts")
    yield
    client.close()


app = FastAPI(title="Ivory Draft API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=r"https?://([a-z0-9\-]+\.)*(emergentagent\.com|vercel\.app|fly\.dev|localhost(:\d+)?)",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(game_router)


@app.get("/api/")
async def root():
    return {"name": "Ivory Draft", "status": "ok"}


@app.get("/api/health")
async def health(request: Request):
    db = request.app.state.db
    try:
        await db.command("ping")
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.websocket("/api/ws/game/{game_id}")
async def ws_game(websocket: WebSocket, game_id: str):
    await manager.connect(game_id, websocket)
    try:
        # Send hello
        await websocket.send_json({"type": "connected", "game_id": game_id})
        while True:
            msg = await websocket.receive_text()
            # Echo pings; clients can send {"type":"ping"}
            if msg:
                await websocket.send_json({"type": "ack"})
    except WebSocketDisconnect:
        await manager.disconnect(game_id, websocket)
    except Exception as e:
        logger.error(f"WS error: {e}")
        await manager.disconnect(game_id, websocket)
