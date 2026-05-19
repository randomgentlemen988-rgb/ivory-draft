import React from "react";

export default function ScoringPanel({ submissions = [], scores = [] }) {
  const aiScores = scores.filter((s) => s.scored_by === "AI_JUDGE");

  return (
    <div className="space-y-4">
      <div className="hairline rounded-xl p-5 bg-zinc-950">
        <div className="font-mono text-[10px] tracking-[0.3em] text-emerald-400 uppercase">
          AI Judge Active
        </div>
        <h3 className="font-display text-xl mt-2">Nemotron is reviewing submissions</h3>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          Players no longer score each other in this mode. The AI judge evaluates each submission for
          grammar, engagement, creativity, and accuracy to the prompt.
        </p>
      </div>

      {submissions.map((sub, index) => {
        const score = aiScores.find((s) => s.submission_id === sub.submission_id);

        return (
          <div key={sub.submission_id} className="hairline rounded-xl p-5 bg-black/40">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 uppercase">
              Submission {index + 1}
            </div>

            <div className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {sub.text}
            </div>

            {score ? (
              <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
                <ScoreBox label="Grammar" value={score.grammar} />
                <ScoreBox label="Engagement" value={score.engagement} />
                <ScoreBox label="Creativity" value={score.creativity} />
                <ScoreBox label="Accuracy" value={score.accuracy} />
                <ScoreBox label="Total" value={score.total} strong />
                <div className="col-span-2 md:col-span-5 mt-2 text-sm text-zinc-400 border-t border-white/10 pt-3">
                  {score.feedback || "No feedback provided."}
                </div>
              </div>
            ) : (
              <div className="mt-5 text-sm text-zinc-500 italic">
                Waiting for AI judge score...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScoreBox({ label, value, strong = false }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
      <div className="font-mono text-[9px] tracking-[0.25em] text-zinc-500 uppercase">{label}</div>
      <div className={`mt-1 font-mono ${strong ? "text-2xl text-emerald-300" : "text-xl text-white"}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}