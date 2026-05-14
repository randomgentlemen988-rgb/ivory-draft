"""Pydantic models for Ivory Draft."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal
from datetime import datetime, timezone
import uuid


def utcnow():
    return datetime.now(timezone.utc)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


# --- USER ---
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: Literal["user", "admin", "moderator"] = "user"
    handle: Optional[str] = None
    bio: Optional[str] = None
    favorite_genres: List[str] = Field(default_factory=list)
    badges: List[str] = Field(default_factory=list)
    games_played: int = 0
    games_won: int = 0
    total_score: float = 0.0
    rank_points: int = 1000
    created_at: datetime = Field(default_factory=utcnow)


# --- SESSION ---
class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=utcnow)


# --- PROMPT ---
class Prompt(BaseModel):
    prompt_id: str = Field(default_factory=lambda: new_id("prompt"))
    text: str
    genre: str
    difficulty: Literal["easy", "medium", "hard", "expert"] = "medium"
    rarity: Literal["common", "uncommon", "rare", "epic", "legendary"] = "common"
    modifier: Optional[str] = None  # special modifier card text
    tags: List[str] = Field(default_factory=list)
    is_ai: bool = False
    is_community: bool = False
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)


# --- GAME ---
class GameSettings(BaseModel):
    rounds: int = 6
    round_seconds: int = 1200  # 20 minutes
    grace_seconds: int = 30
    min_words: int = 175
    max_words: int = 600
    scoring_scale: Literal["1-5", "1-10", "rank"] = "1-10"
    genre_filter: List[str] = Field(default_factory=list)
    difficulty: Optional[str] = None
    private: bool = False


class Player(BaseModel):
    user_id: str
    name: str
    picture: Optional[str] = None
    ready: bool = False
    is_host: bool = False
    eliminated: bool = False
    connected: bool = True
    total_score: float = 0.0


class RoundData(BaseModel):
    round_number: int
    prompt: Optional[Prompt] = None
    started_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    submissions: Dict[str, str] = Field(default_factory=dict)  # user_id -> submission_id
    scoring_open: bool = False
    completed: bool = False


class Game(BaseModel):
    game_id: str = Field(default_factory=lambda: new_id("game"))
    join_code: str
    host_id: str
    settings: GameSettings = Field(default_factory=GameSettings)
    status: Literal["lobby", "in_progress", "duel", "completed", "cancelled"] = "lobby"
    players: List[Player] = Field(default_factory=list)
    current_round: int = 0
    rounds: List[RoundData] = Field(default_factory=list)
    winner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class GameCreate(BaseModel):
    settings: Optional[GameSettings] = None


class GameJoin(BaseModel):
    join_code: str


# --- SUBMISSION ---
class Submission(BaseModel):
    submission_id: str = Field(default_factory=lambda: new_id("sub"))
    game_id: str
    round_number: int
    user_id: str
    text: str
    word_count: int
    submitted_at: datetime = Field(default_factory=utcnow)
    disqualified: bool = False
    dq_reason: Optional[str] = None


class SubmissionCreate(BaseModel):
    text: str


# --- SCORE ---
class Score(BaseModel):
    score_id: str = Field(default_factory=lambda: new_id("score"))
    game_id: str
    round_number: int
    submission_id: str
    submitted_by: str  # the writer (target)
    scored_by: str  # the judge (user_id)
    grammar: float
    engagement: float
    creativity: float
    accuracy: float
    feedback: Optional[str] = None
    total: float = 0.0
    created_at: datetime = Field(default_factory=utcnow)


class ScoreCreate(BaseModel):
    grammar: float
    engagement: float
    creativity: float
    accuracy: float
    feedback: Optional[str] = None
