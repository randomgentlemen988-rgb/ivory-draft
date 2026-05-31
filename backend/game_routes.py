"""Game routes for Ivory Draft."""
import random
import string
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel

from models import (
    User, Game, GameCreate, GameJoin, GameSettings, Player, RoundData,
    Submission, SubmissionCreate, Score, ScoreCreate, Prompt, utcnow, new_id,
)
from auth import get_current_user
from ws_manager import manager

router = APIRouter(prefix="/api", tags=["game"])


def _gen_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def _db(request: Request):
    return request.app.state.db


def _strip_game(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _pick_prompt(db, settings: GameSettings, exclude_ids: List[str], require_dialogue: bool = False) -> dict:
    """Pick a random prompt matching filters."""
    query: Dict = {"prompt_id": {"$nin": exclude_ids}}
    if settings.genre_filter:
        query["genre"] = {"$in": settings.genre_filter}
    if settings.difficulty:
        query["difficulty"] = settings.difficulty
    count = await db.prompts.count_documents(query)
    if count == 0:
        # fall back to any prompt
        query = {"prompt_id": {"$nin": exclude_ids}}
        count = await db.prompts.count_documents(query)
    if count == 0:
        raise HTTPException(500, "No prompts available")
    skip = random.randint(0, max(0, count - 1))
    doc = await db.prompts.find(query, {"_id": 0}).skip(skip).limit(1).to_list(1)
    p = doc[0]
    if require_dialogue:
        p["modifier"] = "Must include dialogue"
    return p


# -------- PROMPTS --------
@router.get("/prompts")
async def list_prompts(
    request: Request,
    genre: Optional[str] = None,
    difficulty: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(50, le=200),
):
    db = await _db(request)
    query: Dict = {}
    if genre:
        query["genre"] = genre
    if difficulty:
        query["difficulty"] = difficulty
    if q:
        query["text"] = {"$regex": q, "$options": "i"}
    rows = await db.prompts.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"prompts": rows, "count": len(rows)}


@router.get("/prompts/genres")
async def prompt_genres(request: Request):
    db = await _db(request)
    rows = await db.prompts.distinct("genre")
    return {"genres": sorted(rows)}


@router.post("/prompts/ai")
async def generate_ai_prompt(
    request: Request,
    genre: str = "Fantasy",
    difficulty: str = "medium",
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    text = await generate_prompt(genre=genre, difficulty=difficulty)
    if not text:
        raise HTTPException(503, "AI prompt service is not configured. Add OPENROUTER_API_KEY.")
    p = Prompt(
        text=text,
        genre=genre,
        difficulty=difficulty,
        rarity="rare",
        is_ai=True,
        created_by=user.user_id,
        tags=[genre.lower(), difficulty, "ai"],
    )
    doc = p.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.prompts.insert_one(doc)
    return {"prompt": _strip_game(doc)}


# -------- GAMES --------
@router.post("/games")
async def create_game(
    payload: GameCreate,
    request: Request,
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    settings = payload.settings or GameSettings()
    join_code = _gen_code()
    # ensure unique
    while await db.games.find_one({"join_code": join_code}, {"_id": 0}):
        join_code = _gen_code()
    host_player = Player(
        user_id=user.user_id, name=user.name, picture=user.picture,
        ready=True, is_host=True,
    )
    game = Game(
        join_code=join_code,
        host_id=user.user_id,
        settings=settings,
        players=[host_player],
    )
    doc = game.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.games.insert_one(doc)
    return _strip_game(doc)


@router.get("/games/public")
async def list_public_games(request: Request):
    db = await _db(request)
    # Only show lobby games that are not cancelled
    rows = await db.games.find(
        {"status": "lobby", "settings.private": False},
        {"_id": 0},
    ).sort("created_at", -1).limit(40).to_list(40)
    return {"games": rows}


@router.get("/games/{game_id}")
async def get_game(game_id: str, request: Request):
    db = await _db(request)
    doc = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Game not found")
    return doc


@router.delete("/games/{game_id}")
async def delete_game(
    game_id: str,
    request: Request,
    user: User = Depends(get_current_user),
):
    """Soft-delete a game. Only host or admin can delete."""
    db = await _db(request)
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(404, "Game not found")
    
    # Authorization: must be host or admin
    is_host = game["host_id"] == user.user_id
    is_admin = user.role == "admin"
    if not is_host and not is_admin:
        raise HTTPException(403, "Only the host or an admin can close this lobby")
    
    # Soft-delete: set status to cancelled and add deleted_at timestamp
    now = _now_iso()
    await db.games.update_one(
        {"game_id": game_id},
        {"$set": {
            "status": "cancelled",
            "deleted_at": now,
            "updated_at": now,
        }},
    )
    
    # Broadcast game_deleted event to all connected clients
    await manager.broadcast(game_id, {"type": "game_deleted", "game_id": game_id})
    
    return {"ok": True, "game_id": game_id, "status": "cancelled"}


@router.post("/games/join")
async def join_game(
    payload: GameJoin,
    request: Request,
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    game = await db.games.find_one({"join_code": payload.join_code.upper()}, {"_id": 0})
    if not game:
        raise HTTPException(404, "Game not found")
    if game["status"] == "cancelled":
        raise HTTPException(400, "This lobby has been closed")
    if game["status"] != "lobby":
        raise HTTPException(400, "Game already started")
    players = game.get("players", [])
    if any(p["user_id"] == user.user_id for p in players):
        return game
    if len(players) >= 6:
        raise HTTPException(400, "Game is full (max 6)")
    new_player = Player(
        user_id=user.user_id, name=user.name, picture=user.picture,
    ).model_dump()
    await db.games.update_one(
        {"game_id": game["game_id"]},
        {"$push": {"players": new_player}, "$set": {"updated_at": _now_iso()}},
    )
    updated = await db.games.find_one({"game_id": game["game_id"]}, {"_id": 0})
    await manager.broadcast(game["game_id"], {"type": "player_joined", "game": updated})
    return updated


@router.post("/games/{game_id}/ready")
async def toggle_ready(
    game_id: str,
    request: Request,
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(404, "Game not found")
    players = game["players"]
    for p in players:
        if p["user_id"] == user.user_id:
            p["ready"] = not p["ready"]
            break
    await db.games.update_one(
        {"game_id": game_id},
        {"$set": {"players": players, "updated_at": _now_iso()}},
    )
    updated = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    await manager.broadcast(game_id, {"type": "ready_change", "game": updated})
    return updated


@router.post("/games/{game_id}/leave")
async def leave_game(
    game_id: str,
    request: Request,
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(404, "Game not found")
    players = [p for p in game["players"] if p["user_id"] != user.user_id]
    if not players:
        await db.games.update_one(
            {"game_id": game_id},
            {"$set": {"status": "cancelled", "updated_at": _now_iso()}},
        )
    else:
        # reassign host if needed
        if game["host_id"] == user.user_id:
            players[0]["is_host"] = True
            new_host = players[0]["user_id"]
            await db.games.update_one(
                {"game_id": game_id},
                {"$set": {"players": players, "host_id": new_host, "updated_at": _now_iso()}},
            )
        else:
            await db.games.update_one(
                {"game_id": game_id},
                {"$set": {"players": players, "updated_at": _now_iso()}},
            )
    updated = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    await manager.broadcast(game_id, {"type": "player_left", "game": updated})
    return updated


@router.post("/games/{game_id}/start")
async def start_game(
    game_id: str,
    request: Request,
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(404, "Game not found")
    if game["host_id"] != user.user_id:
        raise HTTPException(403, "Only the host can start the game")
    if len(game["players"]) < 2:
        raise HTTPException(400, "Need at least 2 players")
    if game["status"] != "lobby":
        raise HTTPException(400, "Already started")

    settings = GameSettings(**game["settings"])
    prompt = await _pick_prompt(db, settings, exclude_ids=[])
    started = datetime.now(timezone.utc)
    ends = started + timedelta(seconds=settings.round_seconds)
    round_data = RoundData(
        round_number=1,
        prompt=Prompt(**prompt),
        started_at=started,
        ends_at=ends,
    ).model_dump()
    round_data["started_at"] = started.isoformat()
    round_data["ends_at"] = ends.isoformat()
    round_data["prompt"]["created_at"] = (
        round_data["prompt"]["created_at"].isoformat()
        if isinstance(round_data["prompt"]["created_at"], datetime)
        else round_data["prompt"]["created_at"]
    )

    await db.games.update_one(
        {"game_id": game_id},
        {"$set": {
            "status": "in_progress",
            "current_round": 1,
            "rounds": [round_data],
            "updated_at": _now_iso(),
        }},
    )
    updated = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    await manager.broadcast(game_id, {"type": "round_start", "game": updated})
    return updated


# -------- SUBMISSIONS --------
@router.post("/games/{game_id}/submit")
async def submit_writing(
    game_id: str,
    payload: SubmissionCreate,
    request: Request,
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(404, "Game not found")
    if game["status"] not in ("in_progress", "duel"):
        raise HTTPException(400, "Game is not active")

    settings = GameSettings(**game["settings"])
    text = payload.text.strip()
    word_count = len([w for w in text.split() if w])
    rnum = game["current_round"]
    # final duel must include dialogue: simple check for quotation marks
    if game["status"] == "duel":
        if '"' not in text and "'" not in text and "“" not in text:
            raise HTTPException(400, "Final duel submissions must include dialogue")

    if word_count < settings.min_words:
        raise HTTPException(400, f"Minimum {settings.min_words} words required (you have {word_count})")
    if word_count > settings.max_words:
        raise HTTPException(400, f"Maximum {settings.max_words} words allowed (you have {word_count})")

    # check player is in game
    in_game = any(p["user_id"] == user.user_id and not p.get("eliminated") for p in game["players"])
    if not in_game:
        raise HTTPException(403, "You are not an active player in this game")

    # check no duplicate submission for this round
    existing = await db.submissions.find_one({
        "game_id": game_id, "round_number": rnum, "user_id": user.user_id,
    }, {"_id": 0})
    if existing:
        raise HTTPException(400, "You have already submitted for this round")

    sub = Submission(
        game_id=game_id,
        round_number=rnum,
        user_id=user.user_id,
        text=text,
        word_count=word_count,
    )
    sdoc = sub.model_dump()
    sdoc["submitted_at"] = sdoc["submitted_at"].isoformat()
    await db.submissions.insert_one(sdoc)

    # update game round submissions map
    rounds = game["rounds"]
    rounds[rnum - 1]["submissions"][user.user_id] = sub.submission_id
    await db.games.update_one(
        {"game_id": game_id},
        {"$set": {"rounds": rounds, "updated_at": _now_iso()}},
    )
    updated = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    await manager.broadcast(game_id, {"type": "submission", "user_id": user.user_id, "game": updated})

    # If all active players submitted, open scoring
    active_players = [p for p in game["players"] if not p.get("eliminated")]
    submissions_map = rounds[rnum - 1]["submissions"]
    if len(submissions_map) >= len(active_players):
        rounds[rnum - 1]["scoring_open"] = True
        await db.games.update_one(
            {"game_id": game_id},
            {"$set": {"rounds": rounds, "updated_at": _now_iso()}},
        )
        updated = await db.games.find_one({"game_id": game_id}, {"_id": 0})
        await manager.broadcast(game_id, {"type": "scoring_open", "game": updated})
        await _run_ai_judging_for_round(db, game_id, rnum)

        # Trigger AI judging immediately
        await _maybe_advance_round(db, game_id)

    return {"submission": _strip_game(sdoc)}


@router.get("/games/{game_id}/submissions")
async def list_round_submissions(
    game_id: str,
    request: Request,
    round_number: Optional[int] = None,
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(404, "Game not found")
    rnum = round_number if round_number is not None else game["current_round"]
    rows = await db.submissions.find(
        {"game_id": game_id, "round_number": rnum},
        {"_id": 0},
    ).to_list(50)
    # Anonymize while scoring is open
    cur_round = game["rounds"][rnum - 1] if 0 < rnum <= len(game["rounds"]) else None
    if cur_round and cur_round.get("scoring_open") and not cur_round.get("completed"):
        for r in rows:
            r["user_id"] = "anon_" + r["submission_id"][-4:]
            r["anonymous"] = True
    return {"submissions": rows, "round_number": rnum}


# -------- SCORING --------
@router.post("/games/{game_id}/score/{submission_id}")
async def submit_score(
    game_id: str,
    submission_id: str,
    payload: ScoreCreate,
    request: Request,
    user: User = Depends(get_current_user),
):
    db = await _db(request)
    sub = await db.submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not sub or sub["game_id"] != game_id:
        raise HTTPException(404, "Submission not found")
    if sub["user_id"] == user.user_id:
        raise HTTPException(400, "Cannot score your own submission")
    existing = await db.scores.find_one({
        "submission_id": submission_id, "scored_by": user.user_id,
    }, {"_id": 0})
    if existing:
        raise HTTPException(400, "Already scored")

    total = payload.grammar + payload.engagement + payload.creativity + payload.accuracy
    score = Score(
        game_id=game_id,
        round_number=sub["round_number"],
        submission_id=submission_id,
        submitted_by=sub["user_id"],
        scored_by=user.user_id,
        grammar=payload.grammar,
        engagement=payload.engagement,
        creativity=payload.creativity,
        accuracy=payload.accuracy,
        feedback=payload.feedback,
        total=total,
    )
    sdoc = score.model_dump()
    sdoc["created_at"] = sdoc["created_at"].isoformat()
    await db.scores.insert_one(sdoc)
    await manager.broadcast(game_id, {"type": "score_submitted", "scored_by": user.user_id})

    # Check if everyone has scored everyone else's submissions for this round
    await _maybe_advance_round(db, game_id)
    return {"score": _strip_game(sdoc)}


async def _maybe_advance_round(db, game_id: str):
    """If all required scores are in, tally and advance."""
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game:
        return
    rnum = game["current_round"]
    cur_round = game["rounds"][rnum - 1]
    if cur_round.get("completed"):
        return
    active_players = [p for p in game["players"] if not p.get("eliminated")]
    n = len(active_players)

    if score_count < expected:
        return

    # Tally
    pipeline = [
        {"$match": {"game_id": game_id, "round_number": rnum}},
        {"$group": {"_id": "$submitted_by", "avg": {"$avg": "$total"}, "n": {"$sum": 1}}},
    ]
    totals = await db.scores.aggregate(pipeline).to_list(50)
    score_map = {t["_id"]: t["avg"] for t in totals}

    # Update player totals
    players = game["players"]
    for p in players:
        if p["user_id"] in score_map:
            p["total_score"] = round(p.get("total_score", 0.0) + score_map[p["user_id"]], 2)

    cur_round["completed"] = True
    cur_round["scoring_open"] = False

    # Decide next step
    settings = GameSettings(**game["settings"])
    next_round = rnum + 1
    new_status = "in_progress"

    if rnum >= 5 and game["status"] == "in_progress":
        # Top 2 advance to final duel
        sorted_players = sorted(
            [p for p in players if not p.get("eliminated")],
            key=lambda p: p.get("total_score", 0.0), reverse=True,
        )
        top2 = {p["user_id"] for p in sorted_players[:2]}
        for p in players:
            if p["user_id"] not in top2:
                p["eliminated"] = True
        new_status = "duel"

    if rnum >= settings.rounds:
        # Game over
        sorted_players = sorted(players, key=lambda p: p.get("total_score", 0.0), reverse=True)
        winner = sorted_players[0] if sorted_players else None
        winner_id = winner["user_id"] if winner else None

        await db.games.update_one(
            {"game_id": game_id},
            {"$set": {
                "rounds": game["rounds"],
                "players": players,
                "status": "completed",
                "winner_id": winner_id,
                "updated_at": _now_iso(),
            }},
        )
        # Update user stats
        for p in players:
            inc = {"games_played": 1, "total_score": p.get("total_score", 0.0)}
            if p["user_id"] == winner_id:
                inc["games_won"] = 1
                inc["rank_points"] = 25
            else:
                inc["rank_points"] = -5
            await db.users.update_one({"user_id": p["user_id"]}, {"$inc": inc})
        final = await db.games.find_one({"game_id": game_id}, {"_id": 0})
        await manager.broadcast(game_id, {"type": "game_over", "game": final})
        return

    # Start next round
    is_final = (next_round == settings.rounds)
    prev_prompt_ids = [r["prompt"]["prompt_id"] for r in game["rounds"] if r.get("prompt")]
    next_prompt = await _pick_prompt(db, settings, exclude_ids=prev_prompt_ids, require_dialogue=is_final)
    started = datetime.now(timezone.utc)
    ends = started + timedelta(seconds=settings.round_seconds)
    new_round = RoundData(
        round_number=next_round,
        prompt=Prompt(**next_prompt),
        started_at=started,
        ends_at=ends,
    ).model_dump()
    new_round["started_at"] = started.isoformat()
    new_round["ends_at"] = ends.isoformat()
    if isinstance(new_round["prompt"].get("created_at"), datetime):
        new_round["prompt"]["created_at"] = new_round["prompt"]["created_at"].isoformat()

    game["rounds"].append(new_round)
    await db.games.update_one(
        {"game_id": game_id},
        {"$set": {
            "rounds": game["rounds"],
            "players": players,
            "current_round": next_round,
            "status": new_status,
            "updated_at": _now_iso(),
        }},
    )
    updated = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    await manager.broadcast(game_id, {"type": "round_advance", "game": updated})


async def _run_ai_judging_for_round(db, game_id: str, round_number: int):
    game = await db.games.find_one({"game_id": game_id}, {"_id": 0})
    if not game or round_number < 1 or round_number > len(game["rounds"]):
        return
    print(f"[ai_judging] AI judging started: game_id={game_id} round={round_number}")
    round_data = game["rounds"][round_number - 1]
    prompt_text = (round_data.get("prompt") or {}).get("text", "")
    subs = await db.submissions.find(
        {"game_id": game_id, "round_number": round_number},
        {"_id": 0},
    ).to_list(200)
    for sub in subs:
        sid = sub["submission_id"]
        existing = await db.scores.find_one(
            {"game_id": game_id, "round_number": round_number, "submission_id": sid, "scored_by": "ai_judge"},
            {"_id": 0},
        )
        if existing:
            continue
        judged = await judge_submission(prompt_text=prompt_text, submission_text=sub.get("text", ""))
        total = judged["grammar"] + judged["engagement"] + judged["creativity"] + judged["accuracy"]
        score = Score(
            game_id=game_id,
            round_number=round_number,
            submission_id=sid,
            submitted_by=sub["user_id"],
            scored_by="ai_judge",
            grammar=judged["grammar"],
            engagement=judged["engagement"],
            creativity=judged["creativity"],
            accuracy=judged["accuracy"],
            feedback=judged.get("feedback"),
            total=total,
        )
        sdoc = score.model_dump()
        sdoc["created_at"] = sdoc["created_at"].isoformat()
        await db.scores.insert_one(sdoc)
        await manager.broadcast(game_id, {"type": "ai_score_created", "submission_id": sid, "score": _strip_game(sdoc)})
        print(f"[ai_judging] AI score saved for submission_id={sid}")
        if judged.get("_fallback"):
            print(f"[ai_judging] AI parse failed/fallback used: submission_id={sid}")

    print(f"[ai_judging] AI judging completed for round: game_id={game_id} round={round_number}")
    await _maybe_advance_round(db, game_id)


@router.get("/games/{game_id}/scores")
async def list_scores(
    game_id: str,
    request: Request,
    round_number: Optional[int] = None,
):
    db = await _db(request)
    q = {"game_id": game_id}
    if round_number is not None:
        q["round_number"] = round_number
    rows = await db.scores.find(q, {"_id": 0}).to_list(500)
    return {"scores": rows}


# -------- LEADERBOARD / PROFILE --------
@router.get("/leaderboard")
async def leaderboard(request: Request, limit: int = 50):
    db = await _db(request)
    rows = await db.users.find(
        {},
        {"_id": 0, "user_id": 1, "name": 1, "handle": 1, "picture": 1,
         "rank_points": 1, "games_played": 1, "games_won": 1, "total_score": 1, "badges": 1},
    ).sort("rank_points", -1).limit(limit).to_list(limit)
    return {"leaderboard": rows}


@router.get("/users/{user_id}")
async def get_profile(user_id: str, request: Request):
    db = await _db(request)
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not u:
        raise HTTPException(404, "User not found")
    games_played = await db.games.count_documents({"players.user_id": user_id, "status": "completed"})
    games_won = await db.games.count_documents({"winner_id": user_id})
    recent = await db.submissions.find(
        {"user_id": user_id}, {"_id": 0},
    ).sort("submitted_at", -1).limit(5).to_list(5)
    return {"user": u, "stats": {"games_played": games_played, "games_won": games_won}, "recent_submissions": recent}


@router.get("/me/games")
async def my_games(request: Request, user: User = Depends(get_current_user)):
    db = await _db(request)
    rows = await db.games.find(
        {"players.user_id": user.user_id},
        {"_id": 0},
    ).sort("updated_at", -1).limit(20).to_list(20)
    return {"games": rows}


# -------- ADMIN --------
class AdminPromptCreate(BaseModel):
    text: str
    genre: str
    difficulty: str = "medium"
    modifier: Optional[str] = None


def _require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")


@router.get("/admin/stats")
async def admin_stats(request: Request, user: User = Depends(get_current_user)):
    _require_admin(user)
    db = await _db(request)
    return {
        "users": await db.users.count_documents({}),
        "games_active": await db.games.count_documents({"status": {"$in": ["lobby", "in_progress", "duel"]}}),
        "games_completed": await db.games.count_documents({"status": "completed"}),
        "prompts": await db.prompts.count_documents({}),
        "submissions": await db.submissions.count_documents({}),
    }


@router.get("/admin/users")
async def admin_users(request: Request, user: User = Depends(get_current_user)):
    _require_admin(user)
    db = await _db(request)
    rows = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return {"users": rows}


@router.post("/admin/prompts")
async def admin_create_prompt(payload: AdminPromptCreate, request: Request, user: User = Depends(get_current_user)):
    _require_admin(user)
    db = await _db(request)
    p = Prompt(
        text=payload.text, genre=payload.genre, difficulty=payload.difficulty,
        modifier=payload.modifier, created_by=user.user_id, is_community=False,
        tags=[payload.genre.lower(), payload.difficulty],
    )
    doc = p.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.prompts.insert_one(doc)
    return {"prompt": _strip_game(doc)}


@router.delete("/admin/prompts/{prompt_id}")
async def admin_delete_prompt(prompt_id: str, request: Request, user: User = Depends(get_current_user)):
    _require_admin(user)
    db = await _db(request)
    res = await db.prompts.delete_one({"prompt_id": prompt_id})
    return {"deleted": res.deleted_count}
