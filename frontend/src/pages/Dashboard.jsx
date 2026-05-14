import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plus, Users, Trophy, BookOpen, Flame, ArrowRight, Clock } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [publicGames, setPublicGames] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [mine, pub, prof] = await Promise.all([
          api.get("/me/games"),
          api.get("/games/public"),
          api.get(`/users/${user.user_id}`),
        ]);
        setGames(mine.data.games || []);
        setPublicGames(pub.data.games || []);
        setStats(prof.data.stats);
      } catch (e) { console.error(e); }
    })();
  }, [user.user_id]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 stagger" data-testid="dashboard-page">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">DRAFT DESK</div>
          <h1 className="font-display text-3xl md:text-5xl tracking-tighter">
            Welcome back, <span className="shimmer-text">{user.name?.split(" ")[0] || "Writer"}</span>.
          </h1>
          <div className="text-zinc-400 mt-2 text-sm">The arena is open. Drafts await.</div>
        </div>
        <button
          data-testid="dashboard-create-game"
          onClick={() => navigate("/lobby")}
          className="inline-flex items-center gap-2 bg-white text-black h-11 px-5 rounded-md font-medium hover:bg-zinc-200 transition-colors"
        >
          <Plus className="w-4 h-4" /> New match
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px hairline rounded-2xl overflow-hidden bg-zinc-900/40 mb-10">
        {[
          { k: "RANK POINTS", v: user.rank_points ?? 1000, icon: Trophy },
          { k: "GAMES PLAYED", v: stats?.games_played ?? user.games_played ?? 0, icon: BookOpen },
          { k: "GAMES WON", v: stats?.games_won ?? user.games_won ?? 0, icon: Flame },
          { k: "TOTAL SCORE", v: (user.total_score || 0).toFixed(1), icon: Users },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.k} className="bg-black/40 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">{s.k}</div>
                <Icon className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <div className="font-mono text-3xl tabular-nums">{s.v}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My recent matches */}
        <div className="lg:col-span-2 hairline rounded-2xl bg-zinc-950 overflow-hidden">
          <div className="px-6 py-4 hairline-b flex items-center justify-between">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">YOUR RECENT MATCHES</div>
            <button onClick={() => navigate("/lobby")} className="font-mono text-[10px] tracking-[0.3em] text-zinc-400 hover:text-white">
              SEE ALL →
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {games.length === 0 && (
              <div className="px-6 py-10 text-center text-zinc-500 text-sm">
                No matches yet. Create or join a lobby to begin.
              </div>
            )}
            {games.map((g) => (
              <button
                key={g.game_id}
                data-testid={`my-game-${g.game_id}`}
                onClick={() => navigate(`/game/${g.game_id}`)}
                className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-xs text-zinc-500 tracking-widest">{g.join_code} · {g.status?.toUpperCase()}</div>
                  <div className="text-sm mt-0.5">{g.players?.length} players · Round {g.current_round}/{g.settings?.rounds}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Public lobbies */}
        <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
          <div className="px-6 py-4 hairline-b flex items-center justify-between">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">OPEN LOBBIES</div>
            <Users className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="divide-y divide-white/5">
            {publicGames.length === 0 && (
              <div className="px-6 py-10 text-center text-zinc-500 text-sm">
                No public lobbies. Start one.
              </div>
            )}
            {publicGames.slice(0, 6).map((g) => (
              <button
                key={g.game_id}
                data-testid={`public-game-${g.game_id}`}
                onClick={() => navigate(`/lobby?code=${g.join_code}`)}
                className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-xs text-zinc-500 tracking-widest">{g.join_code}</div>
                  <div className="text-sm mt-0.5 flex items-center gap-3">
                    <span>{g.players?.length}/6</span>
                    <span className="text-zinc-500">·</span>
                    <span className="flex items-center gap-1 text-zinc-400"><Clock className="w-3 h-3" /> {Math.round((g.settings?.round_seconds || 1200)/60)}m</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
