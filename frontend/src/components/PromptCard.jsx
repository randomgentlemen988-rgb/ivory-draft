import React from "react";

const RARITY_COLORS = {
  common: "text-zinc-400 border-zinc-700",
  uncommon: "text-emerald-400 border-emerald-900",
  rare: "text-sky-400 border-sky-900",
  epic: "text-violet-400 border-violet-900",
  legendary: "text-amber-300 border-amber-900",
};

export default function PromptCard({ prompt, modifier, round, totalRounds }) {
  if (!prompt) return null;
  const rarity = prompt.rarity || "common";
  return (
    <div className="glass rounded-2xl p-8 md:p-10 hairline glow-border animate-fade-in-up" data-testid="prompt-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">PROMPT</span>
          <span className={`font-mono text-[10px] tracking-[0.3em] uppercase border rounded-sm px-2 py-0.5 ${RARITY_COLORS[rarity]}`}>
            {rarity}
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 uppercase">{prompt.genre}</span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 uppercase">{prompt.difficulty}</span>
        </div>
        {round && totalRounds && (
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
            ROUND {String(round).padStart(2, "0")} / {String(totalRounds).padStart(2, "0")}
          </div>
        )}
      </div>
      <p className="font-display text-2xl md:text-3xl leading-snug tracking-tight text-white" data-testid="prompt-text">
        {prompt.text}
      </p>
      {(prompt.modifier || modifier) && (
        <div className="mt-6 pt-5 hairline-t">
          <div className="font-mono text-[10px] tracking-[0.3em] text-amber-400 mb-2">MODIFIER · RULE OF THE ROUND</div>
          <div className="text-zinc-300">{prompt.modifier || modifier}</div>
        </div>
      )}
    </div>
  );
}
