import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Trophy, Crown } from "lucide-react";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/leaderboard");
        setRows(data.leaderboard || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10 stagger" data-testid="leaderboard-page">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">RANKINGS · SEASON 01</div>
          <h1 className="font-display text-3xl md:text-5xl tracking-tighter">Leaderboard</h1>
        </div>
        <Trophy className="w-8 h-8 text-amber-300" />
      </div>

      <div className="hairline rounded-2xl overflow-hidden bg-zinc-950">
        <div className="px-6 py-3 hairline-b grid grid-cols-12 font-mono text-[10px] tracking-[0.3em] text-zinc-500">
          <div className="col-span-1">#</div>
          <div className="col-span-6">WRITER</div>
          <div className="col-span-2 text-right">PLAYED</div>
          <div className="col-span-2 text-right">WON</div>
          <div className="col-span-1 text-right">RP</div>
        </div>
        {rows.length === 0 && (
          <div className="px-6 py-16 text-center text-zinc-500 text-sm">No rankings yet. Play a match.</div>
        )}
        <div className="divide-y divide-white/5">
          {rows.map((u, i) => (
            <button
              key={u.user_id}
              data-testid={`leaderboard-row-${i}`}
              onClick={() => navigate(`/profile/${u.user_id}`)}
              className="w-full px-6 py-4 grid grid-cols-12 items-center hover:bg-white/5 transition-colors text-left"
            >
              <div className="col-span-1 font-mono tabular-nums text-zinc-400 flex items-center gap-1.5">
                {i < 3 && <Crown className={`w-3.5 h-3.5 ${i===0?"text-amber-400":i===1?"text-zinc-300":"text-amber-700"}`} />}
                <span>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="col-span-6 flex items-center gap-3 min-w-0">
                {u.picture ? <img src={u.picture} alt="" className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-zinc-800" />}
                <div className="min-w-0">
                  <div className="text-sm truncate">{u.name}</div>
                  <div className="font-mono text-[10px] tracking-widest text-zinc-500">@{u.handle || u.user_id?.slice(0,8)}</div>
                </div>
              </div>
              <div className="col-span-2 text-right font-mono tabular-nums text-zinc-300">{u.games_played || 0}</div>
              <div className="col-span-2 text-right font-mono tabular-nums text-zinc-300">{u.games_won || 0}</div>
              <div className="col-span-1 text-right font-mono tabular-nums text-white">{u.rank_points || 1000}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
