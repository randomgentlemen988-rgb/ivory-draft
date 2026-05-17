"""Backend tests for Ivory Draft.

Covers: health, prompts, auth, games (create/join/start), submissions,
scoring (auto-advance), leaderboard, profile, admin, websocket.
"""
import os
import asyncio
import uuid
from datetime import datetime, timezone, timedelta

import pytest
import requests
import websockets
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback to frontend .env
    for line in open("/app/frontend/.env"):
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip()
BASE_URL = BASE_URL.rstrip("/")
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def mongo_db():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


def _make_user(mongo_db, role="user"):
    uid = f"test-user-{uuid.uuid4().hex[:10]}"
    token = f"test_session_{uuid.uuid4().hex}"
    mongo_db.users.insert_one({
        "user_id": uid,
        "email": f"TEST_{uid}@example.com",
        "name": f"Test {uid[-4:]}",
        "picture": None,
        "role": role,
        "handle": uid,
        "bio": None,
        "favorite_genres": [],
        "badges": [],
        "games_played": 0,
        "games_won": 0,
        "total_score": 0.0,
        "rank_points": 1000,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    mongo_db.user_sessions.insert_one({
        "user_id": uid,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return uid, token


@pytest.fixture
def user_a(mongo_db):
    uid, token = _make_user(mongo_db)
    yield uid, token
    mongo_db.users.delete_one({"user_id": uid})
    mongo_db.user_sessions.delete_many({"user_id": uid})


@pytest.fixture
def user_b(mongo_db):
    uid, token = _make_user(mongo_db)
    yield uid, token
    mongo_db.users.delete_one({"user_id": uid})
    mongo_db.user_sessions.delete_many({"user_id": uid})


@pytest.fixture
def admin_user(mongo_db):
    uid, token = _make_user(mongo_db, role="admin")
    yield uid, token
    mongo_db.users.delete_one({"user_id": uid})
    mongo_db.user_sessions.delete_many({"user_id": uid})


def _h(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Health & root ----------
class TestHealth:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- Prompts ----------
class TestPrompts:
    def test_list_prompts(self):
        r = requests.get(f"{BASE_URL}/api/prompts", params={"limit": 200})
        assert r.status_code == 200
        data = r.json()
        assert "prompts" in data and data["count"] >= 100, f"Seed expected 181+, got {data.get('count')}"

    def test_prompts_genres(self):
        r = requests.get(f"{BASE_URL}/api/prompts/genres")
        assert r.status_code == 200
        genres = r.json()["genres"]
        assert isinstance(genres, list) and len(genres) >= 15, f"Expected ~18 genres, got {len(genres)}"

    def test_prompts_filter_genre(self):
        # use the genre 'Horror' if present, else first available
        gr = requests.get(f"{BASE_URL}/api/prompts/genres").json()["genres"]
        target = "Horror" if "Horror" in gr else gr[0]
        r = requests.get(f"{BASE_URL}/api/prompts", params={"genre": target, "limit": 200})
        assert r.status_code == 200
        data = r.json()
        assert data["count"] > 0
        for p in data["prompts"]:
            assert p["genre"] == target


# ---------- Auth ----------
class TestAuth:
    def test_session_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/session", json={"session_id": "invalid_bogus"})
        # 401 from emergent or 502 if unreachable; accept 401 ideally
        assert r.status_code in (401, 502)

    def test_me_no_auth(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, user_a):
        uid, token = user_a
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=_h(token))
        assert r.status_code == 200
        assert r.json()["user_id"] == uid


# ---------- Games ----------
class TestGames:
    def test_create_game(self, user_a, mongo_db):
        uid, token = user_a
        r = requests.post(f"{BASE_URL}/api/games", json={}, headers=_h(token))
        assert r.status_code == 200, r.text
        data = r.json()
        assert "game_id" in data and "join_code" in data
        assert data["host_id"] == uid
        assert len(data["players"]) == 1
        mongo_db.games.delete_one({"game_id": data["game_id"]})

    def test_list_public_games(self, user_a, mongo_db):
        uid, token = user_a
        r = requests.post(f"{BASE_URL}/api/games", json={}, headers=_h(token))
        gid = r.json()["game_id"]
        r2 = requests.get(f"{BASE_URL}/api/games/public")
        assert r2.status_code == 200
        assert any(g["game_id"] == gid for g in r2.json()["games"])
        mongo_db.games.delete_one({"game_id": gid})

    def test_get_game_by_id(self, user_a, mongo_db):
        uid, token = user_a
        r = requests.post(f"{BASE_URL}/api/games", json={}, headers=_h(token))
        gid = r.json()["game_id"]
        r2 = requests.get(f"{BASE_URL}/api/games/{gid}")
        assert r2.status_code == 200
        assert r2.json()["game_id"] == gid
        mongo_db.games.delete_one({"game_id": gid})

    def test_join_game(self, user_a, user_b, mongo_db):
        _, ta = user_a
        ub, tb = user_b
        r = requests.post(f"{BASE_URL}/api/games", json={}, headers=_h(ta))
        join_code = r.json()["join_code"]
        gid = r.json()["game_id"]
        r2 = requests.post(f"{BASE_URL}/api/games/join", json={"join_code": join_code}, headers=_h(tb))
        assert r2.status_code == 200
        assert any(p["user_id"] == ub for p in r2.json()["players"])
        mongo_db.games.delete_one({"game_id": gid})


# ---------- Full game flow ----------
class TestGameFlow:
    def test_start_submit_score_advance(self, user_a, user_b, mongo_db):
        ua, ta = user_a
        ub, tb = user_b
        # Create + join
        r = requests.post(f"{BASE_URL}/api/games", json={}, headers=_h(ta))
        assert r.status_code == 200
        gid = r.json()["game_id"]
        code = r.json()["join_code"]
        requests.post(f"{BASE_URL}/api/games/join", json={"join_code": code}, headers=_h(tb))

        # Non-host start should 403
        r403 = requests.post(f"{BASE_URL}/api/games/{gid}/start", headers=_h(tb))
        assert r403.status_code == 403

        # Host start
        rs = requests.post(f"{BASE_URL}/api/games/{gid}/start", headers=_h(ta))
        assert rs.status_code == 200, rs.text
        g = rs.json()
        assert g["status"] == "in_progress"
        assert g["current_round"] == 1
        assert g["rounds"][0]["prompt"] is not None
        assert g["rounds"][0]["ends_at"]

        # Submit below min_words
        short = "word " * 10
        rshort = requests.post(f"{BASE_URL}/api/games/{gid}/submit",
                               json={"text": short}, headers=_h(ta))
        assert rshort.status_code == 400

        # Submit valid (>=175 words)
        text = ("alpha " * 200).strip()
        r1 = requests.post(f"{BASE_URL}/api/games/{gid}/submit",
                           json={"text": text}, headers=_h(ta))
        assert r1.status_code == 200, r1.text

        # Duplicate by same user
        rdup = requests.post(f"{BASE_URL}/api/games/{gid}/submit",
                             json={"text": text}, headers=_h(ta))
        assert rdup.status_code == 400

        # Submit valid by B
        text_b = ("beta " * 200).strip()
        r2 = requests.post(f"{BASE_URL}/api/games/{gid}/submit",
                           json={"text": text_b}, headers=_h(tb))
        assert r2.status_code == 200

        # Submissions list - anonymized while scoring open
        rl = requests.get(f"{BASE_URL}/api/games/{gid}/submissions", headers=_h(ta))
        assert rl.status_code == 200
        subs = rl.json()["submissions"]
        assert len(subs) == 2
        assert all(s.get("anonymous") for s in subs), "Expected anonymized while scoring open"

        # Find each submission ids
        sub_a = next(s for s in subs if s["text"].startswith("alpha"))
        sub_b = next(s for s in subs if s["text"].startswith("beta"))

        # Self-score should fail
        rself = requests.post(
            f"{BASE_URL}/api/games/{gid}/score/{sub_a['submission_id']}",
            json={"grammar": 8, "engagement": 8, "creativity": 8, "accuracy": 8},
            headers=_h(ta),
        )
        assert rself.status_code == 400

        # A scores B's
        rscoreA = requests.post(
            f"{BASE_URL}/api/games/{gid}/score/{sub_b['submission_id']}",
            json={"grammar": 7, "engagement": 7, "creativity": 7, "accuracy": 7},
            headers=_h(ta),
        )
        assert rscoreA.status_code == 200

        # Duplicate score by same judge
        rdupS = requests.post(
            f"{BASE_URL}/api/games/{gid}/score/{sub_b['submission_id']}",
            json={"grammar": 5, "engagement": 5, "creativity": 5, "accuracy": 5},
            headers=_h(ta),
        )
        assert rdupS.status_code == 400

        # B scores A's -> should trigger advance (n*(n-1)=2)
        rscoreB = requests.post(
            f"{BASE_URL}/api/games/{gid}/score/{sub_a['submission_id']}",
            json={"grammar": 9, "engagement": 9, "creativity": 9, "accuracy": 9},
            headers=_h(tb),
        )
        assert rscoreB.status_code == 200

        # Game should have advanced to round 2
        rg = requests.get(f"{BASE_URL}/api/games/{gid}")
        gdoc = rg.json()
        assert gdoc["current_round"] == 2, f"Expected round 2 after all scores, got {gdoc['current_round']}"
        assert len(gdoc["rounds"]) == 2
        assert gdoc["rounds"][0]["completed"] is True

        # Cleanup
        mongo_db.games.delete_one({"game_id": gid})
        mongo_db.submissions.delete_many({"game_id": gid})
        mongo_db.scores.delete_many({"game_id": gid})


# ---------- Leaderboard / profile ----------
class TestLeaderboardProfile:
    def test_leaderboard(self):
        r = requests.get(f"{BASE_URL}/api/leaderboard")
        assert r.status_code == 200
        assert "leaderboard" in r.json()

    def test_profile(self, user_a):
        uid, _ = user_a
        r = requests.get(f"{BASE_URL}/api/users/{uid}")
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["user_id"] == uid
        assert "stats" in data

    def test_profile_not_found(self):
        r = requests.get(f"{BASE_URL}/api/users/nonexistent_user_xyz")
        assert r.status_code == 404


# ---------- Admin ----------
class TestAdmin:
    def test_admin_requires_role(self, user_a):
        _, token = user_a
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=_h(token))
        assert r.status_code == 403

    def test_admin_stats(self, admin_user):
        _, token = admin_user
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=_h(token))
        assert r.status_code == 200
        d = r.json()
        for k in ("users", "games_active", "games_completed", "prompts", "submissions"):
            assert k in d

    def test_admin_users(self, admin_user):
        _, token = admin_user
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=_h(token))
        assert r.status_code == 200
        assert "users" in r.json()

    def test_admin_prompt_crud(self, admin_user, mongo_db):
        _, token = admin_user
        r = requests.post(f"{BASE_URL}/api/admin/prompts",
                          json={"text": "TEST_PROMPT body content", "genre": "Horror", "difficulty": "easy"},
                          headers=_h(token))
        assert r.status_code == 200
        pid = r.json()["prompt"]["prompt_id"]
        # Delete
        rd = requests.delete(f"{BASE_URL}/api/admin/prompts/{pid}", headers=_h(token))
        assert rd.status_code == 200
        assert rd.json()["deleted"] == 1


# ---------- WebSocket ----------
class TestWebSocket:
    def test_ws_connect_and_ack(self):
        ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/ws/game/test_ws_game"

        async def run():
            async with websockets.connect(ws_url) as ws:
                hello = await asyncio.wait_for(ws.recv(), timeout=10)
                assert "connected" in hello
                await ws.send("ping")
                ack = await asyncio.wait_for(ws.recv(), timeout=10)
                assert "ack" in ack

        asyncio.run(run())
