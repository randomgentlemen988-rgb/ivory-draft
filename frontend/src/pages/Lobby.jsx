import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, KeyRound, Users, Globe, Lock, Clock, BookOpen, X } from "lucide-react";

export default function Lobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const initialCode = searchParams.get("code") || "";
  const [joinCode, setJoinCode] = useState(initialCode);
  const [publicGames, setPublicGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [settings, setSettings] = useState({
    rounds: 6,
    round_seconds: 1200,
    min_words: 175,
    max_words: 600,
    scoring_scale: "1-10",
    genre_filter: [],
    difficulty: null,
    private: false,
  });
  const [creating, setCreating] = useState(false);
  const [confirmClose, setConfirmClose] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [pub, gen] = await Promise.all([
          api.get("/games/public"),
          api.get("/prompts/genres"),
        ]);
        setPublicGames(pub.data.games || []);
        setGenres(gen.data.genres || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/games", { settings });
      toast.success(`Lobby created · ${data.join_code}`);
      navigate(`/game/${data.game_id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode) { toast.error("Enter a join code"); return; }
    try {
      const { data } = await api.post("/games/join", { join_code: joinCode.toUpperCase() });
      navigate(`/game/${data.game_id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not join");
    }
  };

  const toggleGenre = (g) => {
    setSettings((s) => ({
      ...s,
      genre_filter: s.genre_filter.includes(g)
        ? s.genre_filter.filter((x) => x !== g)
        : [...s.genre_filter, g],
    }));
  };

  const handleCloseLobby = async (gameId) => {
    try {
      await api.delete(`/games/${gameId}`);
      setPublicGames((prev) => prev.filter((g) => g.game_id !== gameId));
      toast.success("Lobby closed");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not close lobby");
    } finally {
      setConfirmClose(null);
    }
  };

  const canCloseLobby = (game) => {
    if (!user) return false;
    return game.host_id === user.user_id || user.role === "admin";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 stagger" data-testid="lobby-page">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">MATCHMAKING</div>
        <h1 className="font-display text-3xl md:text-5xl tracking-tighter">Find a draft. Or start one.</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Join + Public */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 hairline">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">JOIN BY CODE</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  data-testid="join-code-input"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="6-character code, e.g. AB12CD"
                  className="w-full bg-zinc-950 hairline rounded-md pl-10 pr-4 h-11 font-mono tracking-widest uppercase placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  maxLength={8}
                />
              </div>
              <button
                data-testid="join-game-button"
                onClick={handleJoin}
                className="bg-white text-black h-11 px-6 rounded-md font-medium hover:bg-zinc-200 transition-colors"
              >
                Join lobby
              </button>
            </div>
          </div>

          <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
            <div className="px-6 py-4 hairline-b flex items-center justify-between">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">OPEN LOBBIES · LIVE</div>
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="divide-y divide-white/5">
              {publicGames.length === 0 && (
                <div className="px-6 py-12 text-center text-zinc-500 text-sm">
                  No lobbies currently. Be the first to open one.
                </div>
              )}
              {publicGames.map((g) => (
                <div
                  key={g.game_id}
                  className="w-full px-6 py-4 hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <button
                    data-testid={`lobby-row-${g.join_code}`}
                    onClick={() => setJoinCode(g.join_code)}
                    className="flex-1 text-left flex items-center gap-4"
                  >
                    <div className="font-mono text-sm tracking-widest text-white">{g.join_code}</div>
                    <div className="text-xs text-zinc-500">
                      <span className="text-zinc-300">{g.players?.length}/6</span> · {Math.round((g.settings?.round_seconds || 1200)/60)} min/round · {g.settings?.rounds} rounds
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {(g.settings?.genre_filter || []).slice(0, 2).map((x) => (
                      <span key={x} className="font-mono text-[10px] tracking-widest text-zinc-400 hairline rounded-sm px-1.5 py-0.5">{x}</span>
                    ))}
                    {canCloseLobby(g) && (
                      confirmClose === g.game_id ? (
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-xs text-zinc-400">Close this lobby?</span>
                          <button
                            onClick={() => handleCloseLobby(g.game_id)}
                            data-testid={`confirm-close-${g.join_code}`}
                            className="text-xs px-2 py-1 rounded border border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmClose(null)}
                            className="text-xs px-2 py-1 rounded border border-zinc-600 text-zinc-400 hover:bg-zinc-700/50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmClose(g.game_id); }}
                          data-testid={`close-lobby-${g.join_code}`}
                          title="Close lobby"
                          className="ml-2 p-1.5 rounded border border-zinc-700 text-zinc-400 hover:border-red-500/50 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create */}
        <div className="glass rounded-2xl p-6 hairline space-y-5" data-testid="create-lobby-card">
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">CREATE LOBBY</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] tracking-widest text-zinc-500">ROUNDS</label>
              <input
                type="number" min="2" max="10"
                value={settings.rounds}
                onChange={(e) => setSettings({ ...settings, rounds: Number(e.target.value) })}
                className="mt-1 w-full bg-zinc-950 hairline rounded-md px-3 h-10 text-sm focus:outline-none focus:border-zinc-500"
                data-testid="setting-rounds"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-widest text-zinc-500">MIN / ROUND</label>
              <input
                type="number" min="1" max="30"
                value={Math.round(settings.round_seconds / 60)}
                onChange={(e) => setSettings({ ...settings, round_seconds: Math.max(60, Number(e.target.value) * 60) })}
                className="mt-1 w-full bg-zinc-950 hairline rounded-md px-3 h-10 text-sm focus:outline-none focus:border-zinc-500"
                data-testid="setting-round-min"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-widest text-zinc-500">MIN WORDS</label>
              <input
                type="number" min="50" max="500"
                value={settings.min_words}
                onChange={(e) => setSettings({ ...settings, min_words: Number(e.target.value) })}
                className="mt-1 w-full bg-zinc-950 hairline rounded-md px-3 h-10 text-sm focus:outline-none focus:border-zinc-500"
                data-testid="setting-min-words"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-widest text-zinc-500">MAX WORDS</label>
              <input
                type="number" min="100" max="2000"
                value={settings.max_words}
                onChange={(e) => setSettings({ ...settings, max_words: Number(e.target.value) })}
                className="mt-1 w-full bg-zinc-950 hairline rounded-md px-3 h-10 text-sm focus:outline-none focus:border-zinc-500"
                data-testid="setting-max-words"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] tracking-widest text-zinc-500">GENRE FILTER (OPTIONAL)</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  data-testid={`genre-${g}`}
                  className={`text-xs px-2.5 h-7 rounded-sm hairline transition-colors ${
                    settings.genre_filter.includes(g)
                      ? "bg-white text-black border-white"
                      : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.private}
              onChange={(e) => setSettings({ ...settings, private: e.target.checked })}
              className="accent-white"
              data-testid="setting-private"
            />
            <span className="text-sm flex items-center gap-1.5"><Lock className="w-3 h-3" /> Private lobby (code only)</span>
          </label>

          <button
            onClick={handleCreate}
            disabled={creating}
            data-testid="create-lobby-button"
            className="w-full inline-flex items-center justify-center gap-2 bg-white text-black h-11 rounded-md font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> {creating ? "Opening lobby…" : "Open lobby"}
          </button>
        </div>
      </div>
    </div>
  );
}
