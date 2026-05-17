import React from "react";
import { Crown, Check, CircleSlash, User } from "lucide-react";

export default function PlayerList({ players, currentUserId, hostId, showScores }) {
  return (
    <div className="space-y-2" data-testid="player-list">
      {players.map((p) => {
        const isHost = p.user_id === hostId;
        const isYou = p.user_id === currentUserId;
        return (
          <div
            key={p.user_id}
            className={`flex items-center justify-between px-3 py-2.5 rounded-md hairline ${p.eliminated ? "opacity-40" : ""}`}
            data-testid={`player-${p.user_id}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {p.picture ? (
                <img src={p.picture} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm truncate flex items-center gap-1.5">
                  {p.name}
                  {isHost && <Crown className="w-3 h-3 text-amber-400" />}
                  {isYou && <span className="font-mono text-[9px] tracking-widest text-zinc-500">YOU</span>}
                </div>
                {showScores && (
                  <div className="font-mono text-[10px] tracking-widest text-zinc-500 tabular-nums">
                    {Number(p.total_score || 0).toFixed(1)} PTS
                  </div>
                )}
              </div>
            </div>
            <div>
              {p.eliminated ? (
                <CircleSlash className="w-4 h-4 text-zinc-600" />
              ) : p.ready ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="font-mono text-[10px] tracking-widest text-zinc-600">PENDING</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
