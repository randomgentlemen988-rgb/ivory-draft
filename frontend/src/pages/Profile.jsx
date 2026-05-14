import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Trophy, BookOpen, Flame, Star } from "lucide-react";

export default function Profile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/users/${userId}`);
        setData(data);
      } catch (e) { console.error(e); }
    })();
  }, [userId]);

  if (!data) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-500 font-mono text-xs tracking-widest">LOADING PROFILE…</div>;
  const u = data.user;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10 stagger" data-testid="profile-page">
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-10">
        {u.picture ? (
          <img src={u.picture} alt="" className="w-24 h-24 rounded-2xl hairline" />
        ) : (
          <div className="w-24 h-24 rounded-2xl hairline bg-zinc-950 flex items-center justify-center text-3xl font-display">
            {u.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-1">@{u.handle || u.email?.split("@")[0]}</div>
          <h1 className="font-display text-4xl tracking-tighter">{u.name}</h1>
          <div className="text-zinc-400 mt-1 text-sm">{u.bio || "Drafting in the ivory arena."}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px hairline rounded-2xl overflow-hidden bg-zinc-900/40 mb-8">
        {[
          { k: "RANK", v: u.rank_points ?? 1000, icon: Trophy },
          { k: "PLAYED", v: data.stats.games_played, icon: BookOpen },
          { k: "WON", v: data.stats.games_won, icon: Flame },
          { k: "TOTAL", v: (u.total_score || 0).toFixed(1), icon: Star },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.k} className="bg-black/40 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">{s.k}</div>
                <Icon className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <div className="font-mono text-2xl tabular-nums">{s.v}</div>
            </div>
          );
        })}
      </div>

      <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
        <div className="px-6 py-4 hairline-b font-mono text-[10px] tracking-[0.3em] text-zinc-500">RECENT DRAFTS</div>
        {data.recent_submissions?.length ? (
          <div className="divide-y divide-white/5">
            {data.recent_submissions.map((s) => (
              <div key={s.submission_id} className="px-6 py-4">
                <div className="font-mono text-[10px] tracking-widest text-zinc-500 mb-1">
                  ROUND {s.round_number} · {s.word_count} WORDS
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed line-clamp-3">{s.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-zinc-500 text-sm">No drafts yet.</div>
        )}
      </div>
    </div>
  );
}
