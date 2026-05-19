import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, WS_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Timer from "@/components/Timer";
import Editor from "@/components/Editor";
import PromptCard from "@/components/PromptCard";
import PlayerList from "@/components/PlayerList";
import { Play, Trophy, ArrowLeft, Send, LogOut } from "lucide-react";

export default function GameRoom() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [draft, setDraft] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState([]);
  const wsRef = useRef(null);

  const loadGame = useCallback(async () => {
    try {
      const { data } = await api.get(`/games/${gameId}`);
      setGame(data);
    } catch (e) {
      toast.error("Game not found");
      navigate("/lobby");
    }
  }, [gameId, navigate]);

  const loadSubmissions = useCallback(async () => {
    try {
      const { data } = await api.get(`/games/${gameId}/submissions`);
      setSubmissions(data.submissions || []);
    } catch {}
  }, [gameId]);

  const loadScores = useCallback(async () => {
    try {
      const { data } = await api.get(`/games/${gameId}/scores`);
      setScores(data.scores || []);
    } catch {}
  }, [gameId]);

  // Initial load
  useEffect(() => { loadGame(); }, [loadGame]);

  // Restore draft from localStorage
  useEffect(() => {
    if (!game) return;
    const key = `draft:${game.game_id}:${game.current_round}`;
    const saved = localStorage.getItem(key);
    if (saved) setDraft(saved);
    else setDraft("");
    setSubmitted(false);
  }, [game?.game_id, game?.current_round]); // eslint-disable-line

  // Check submitted status
  useEffect(() => {
    if (!game) return;
    const r = game.rounds?.[game.current_round - 1];
    if (r?.submissions && r.submissions[user.user_id]) {
      setSubmitted(true);
    }
  }, [game, user.user_id]);

  // Load submissions when scoring opens
  useEffect(() => {
    const r = game?.rounds?.[game?.current_round - 1];
    if (r?.scoring_open || r?.completed) {
      loadSubmissions();
      loadScores();
    }
  }, [game, loadSubmissions, loadScores]);

  // WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/game/${gameId}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.game) setGame(msg.game);
        if (msg.type === "scoring_open" || msg.type === "round_advance" || msg.type === "game_over") {
          loadSubmissions();
          loadScores();
        }
      } catch {}
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => { try { ws.close(); } catch {} };
  }, [gameId, loadSubmissions, loadScores]);

  if (!game) return <div className="min-h-screen flex items-center justify-center text-zinc-500 font-mono text-xs tracking-widest">LOADING ARENA…</div>;

  const currentRound = game.rounds?.[game.current_round - 1];
  const isHost = game.host_id === user.user_id;
  const isPlayer = (game.players || []).some((p) => p.user_id === user.user_id);
  const me = (game.players || []).find((p) => p.user_id === user.user_id);
  const isEliminated = me?.eliminated;
  const inFinalDuel = game.status === "duel";
  const settings = game.settings;

  const handleStart = async () => {
    try {
      await api.post(`/games/${gameId}/start`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not start");
    }
  };

  const handleReady = async () => {
    try { await api.post(`/games/${gameId}/ready`); } catch {}
  };

  const handleLeave = async () => {
    try {
      await api.post(`/games/${gameId}/leave`);
      navigate("/lobby");
    } catch {}
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/games/${gameId}/submit`, { text: draft });
      setSubmitted(true);
      toast.success("Submission locked in");
      const key = `draft:${game.game_id}:${game.current_round}`;
      localStorage.removeItem(key);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Submission failed");
    }
  };

  // ---- LOBBY VIEW ----
  if (game.status === "lobby") {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 stagger" data-testid="game-lobby-view">
        <button onClick={() => navigate("/lobby")} className="text-zinc-500 hover:text-white text-sm flex items-center gap-1.5 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to lobbies
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-2xl p-8 hairline">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">WAITING ROOM</div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tighter mt-2">Lobby <span className="font-mono tabular-nums text-zinc-400">·</span> <span className="font-mono">{game.join_code}</span></h1>
            <div className="text-zinc-400 mt-2 text-sm">
              {settings.rounds} rounds · {Math.round(settings.round_seconds/60)} min each · {settings.min_words}–{settings.max_words} words
              {settings.genre_filter?.length ? ` · ${settings.genre_filter.join(", ")}` : ""}
            </div>

            <div className="mt-8">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">PLAYERS · {game.players?.length}/6</div>
              <PlayerList players={game.players} currentUserId={user.user_id} hostId={game.host_id} />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isPlayer && !isHost && (
                <button onClick={handleReady} data-testid="ready-button" className="hairline h-10 px-4 rounded-md hover:bg-white/5">
                  {me?.ready ? "Unready" : "Ready up"}
                </button>
              )}
              {isHost && (
                <button
                  onClick={handleStart}
                  disabled={game.players.length < 2}
                  data-testid="start-game-button"
                  className="inline-flex items-center gap-2 bg-white text-black h-10 px-5 rounded-md font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4" /> Start match
                </button>
              )}
              {isPlayer && (
                <button onClick={handleLeave} data-testid="leave-button" className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Leave
                </button>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 hairline">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">INVITE</div>
            <div className="font-mono text-4xl tracking-widest text-center py-6 hairline rounded-xl bg-zinc-950">{game.join_code}</div>
            <button
              onClick={() => { navigator.clipboard.writeText(game.join_code); toast.success("Copied"); }}
              className="mt-4 w-full hairline h-10 rounded-md text-sm hover:bg-white/5"
            >
              Copy code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- COMPLETED VIEW ----
  if (game.status === "completed") {
    const ranked = [...(game.players || [])].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    const winner = ranked[0];
    return (
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12 stagger" data-testid="game-completed-view">
        <div className="text-center mb-12">
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">CHAMPION CROWNED</div>
          <Trophy className="w-12 h-12 mx-auto text-amber-300 mb-4" />
          <h1 className="font-display text-4xl md:text-6xl tracking-tighter">{winner?.name}</h1>
          <div className="text-zinc-400 mt-2">Total · {(winner?.total_score || 0).toFixed(1)} points across {game.rounds?.length} rounds</div>
        </div>
        <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
          {ranked.map((p, i) => (
            <div key={p.user_id} className="px-6 py-4 hairline-b flex items-center justify-between last:border-b-0">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xl tabular-nums text-zinc-500 w-8">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium">{p.name}</span>
                {p.user_id === game.winner_id && <Trophy className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="font-mono tabular-nums">{(p.total_score || 0).toFixed(1)}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="hairline h-10 px-5 rounded-md hover:bg-white/5">Dashboard</button>
          <button onClick={() => navigate("/lobby")} data-testid="play-again-button" className="bg-white text-black h-10 px-5 rounded-md font-medium hover:bg-zinc-200">Play again</button>
        </div>
      </div>
    );
  }

  // ---- IN-PROGRESS / DUEL VIEW ----
  const scoringOpen = currentRound?.scoring_open && !currentRound?.completed;
  const visibleSubs = submissions;
  const aiScoresBySubmission = scores.reduce((acc, score) => {
    if (score.submission_id && score.scored_by === "ai_judge") {
      acc[score.submission_id] = score;
    }
    return acc;
  }, {});
  const totalSubmissions = visibleSubs.length;
  const scoredSubmissions = visibleSubs.filter((s) => aiScoresBySubmission[s.submission_id]).length;
  const allScoresExist = totalSubmissions > 0 && scoredSubmissions >= totalSubmissions;
  const myEndsAt = currentRound?.ends_at;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8" data-testid="game-active-view">
      {/* Top bar with timer + round info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
            {inFinalDuel ? "FINAL DUEL · DIALOGUE REQUIRED" : `ROUND ${game.current_round} OF ${settings.rounds}`}
          </div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight mt-1">
            {scoringOpen ? "Judging phase" : currentRound?.completed ? "Round complete" : "Drafting phase"}
          </h1>
        </div>
        {!scoringOpen && !currentRound?.completed && (
          <Timer endsAt={myEndsAt} warningSeconds={60} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main writing/scoring panel */}
        <div className="lg:col-span-3 space-y-6">
          {currentRound?.prompt && (
            <PromptCard
              prompt={currentRound.prompt}
              modifier={inFinalDuel ? "Must include dialogue" : null}
              round={game.current_round}
              totalRounds={settings.rounds}
            />
          )}

          {/* Drafting */}
          {!scoringOpen && !currentRound?.completed && isPlayer && !isEliminated && (
            <div className="glass rounded-2xl p-8 hairline">
              {submitted ? (
                <div className="text-center py-16" data-testid="submitted-state">
                  <Send className="w-8 h-8 mx-auto text-emerald-400 mb-3" />
                  <div className="font-display text-2xl">Locked in.</div>
                  <div className="text-zinc-400 mt-2 text-sm">Waiting on the others. Judging opens automatically.</div>
                </div>
              ) : (
                <>
                  <Editor
                    value={draft}
                    onChange={setDraft}
                    minWords={settings.min_words}
                    maxWords={settings.max_words}
                    autosaveKey={`draft:${game.game_id}:${game.current_round}`}
                    placeholder={`Begin your ${currentRound?.prompt?.genre?.toLowerCase()} draft. ${inFinalDuel ? "Dialogue required. " : ""}Minimum ${settings.min_words} words.`}
                  />
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={handleSubmit}
                      data-testid="submit-button"
                      className="inline-flex items-center gap-2 bg-white text-black h-10 px-5 rounded-md font-medium hover:bg-zinc-200 transition-colors"
                    >
                      <Send className="w-4 h-4" /> Submit
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Eliminated */}
          {isEliminated && (
            <div className="glass rounded-2xl p-10 hairline text-center" data-testid="eliminated-state">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">SPECTATOR</div>
              <div className="font-display text-2xl">You did not advance to the final duel.</div>
              <div className="text-zinc-400 mt-2 text-sm">Stick around to watch the duel unfold.</div>
            </div>
          )}

          {/* Scoring */}
          {scoringOpen && (
            <div className="space-y-4" data-testid="judging-list">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
                AI JUDGING · RESULTS
              </div>
              <div className="text-sm text-zinc-400">
                {allScoresExist
                  ? "Preparing next round…"
                  : `AI judging in progress · ${scoredSubmissions}/${totalSubmissions} scored`}
              </div>
              {visibleSubs.map((s) => (
                aiScoresBySubmission[s.submission_id] ? (
                  <div key={s.submission_id} className="glass rounded-xl p-5 hairline bg-zinc-950/70">
                    <div className="font-mono text-[10px] tracking-widest text-zinc-500">AI SCORECARD</div>
                    <div className="text-sm text-zinc-300 mt-3">{s.text.slice(0, 120)}…</div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {["grammar", "engagement", "creativity", "accuracy"].map((k) => (
                        <div key={k} className="hairline rounded-md px-3 py-2 bg-zinc-900/70">
                          <div className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">{k}</div>
                          <div className="font-mono text-sm text-white tabular-nums">
                            {(aiScoresBySubmission[s.submission_id][k] ?? 0).toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-zinc-400">
                      {aiScoresBySubmission[s.submission_id].feedback || "AI feedback pending…"}
                    </div>
                  </div>
                ) : (
                  <div key={s.submission_id} className="hairline rounded-xl p-10 text-center text-zinc-500 text-sm bg-zinc-950">
                    Awaiting AI evaluation…
                  </div>
                )
              ))}
              {visibleSubs.length === 0 && (
                <div className="hairline rounded-xl p-10 text-center text-zinc-500 text-sm bg-zinc-950">
                  Waiting for submissions to finalize…
                </div>
              )}
            </div>
          )}

          {/* Round complete (between rounds) */}
          {currentRound?.completed && (
            <div className="glass rounded-2xl p-10 hairline text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">ROUND COMPLETE</div>
              <div className="font-display text-2xl">Next round preparing…</div>
            </div>
          )}
        </div>

        {/* Sidebar: players + standings */}
        <div className="space-y-4">
          <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
            <div className="px-4 py-3 hairline-b font-mono text-[10px] tracking-[0.3em] text-zinc-500">
              STANDINGS
            </div>
            <div className="p-3">
              <PlayerList
                players={[...(game.players || [])].sort((a,b) => (b.total_score||0)-(a.total_score||0))}
                currentUserId={user.user_id}
                hostId={game.host_id}
                showScores
              />
            </div>
          </div>
          <div className="hairline rounded-2xl bg-zinc-950 p-4">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">JOIN CODE</div>
            <div className="font-mono text-lg tracking-widest">{game.join_code}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
