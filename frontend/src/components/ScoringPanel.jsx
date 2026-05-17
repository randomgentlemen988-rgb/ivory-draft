import React, { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "grammar", label: "Grammar & Clarity" },
  { key: "engagement", label: "Engagement" },
  { key: "creativity", label: "Creativity & Originality" },
  { key: "accuracy", label: "Accuracy to Prompt" },
];

export default function ScoringPanel({ gameId, submission, onScored }) {
  const [scores, setScores] = useState({ grammar: 7, engagement: 7, creativity: 7, accuracy: 7 });
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/games/${gameId}/score/${submission.submission_id}`, {
        ...scores, feedback,
      });
      toast.success("Score recorded");
      onScored?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to score");
    } finally {
      setSubmitting(false);
    }
  };

  const total = scores.grammar + scores.engagement + scores.creativity + scores.accuracy;

  return (
    <div className="glass rounded-xl p-5 hairline" data-testid={`scoring-panel-${submission.submission_id}`}>
      <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">
        ANONYMOUS · {submission.user_id} · {submission.word_count} WORDS
      </div>
      <div className="text-zinc-200 leading-relaxed text-[15px] whitespace-pre-wrap mb-5 max-h-80 overflow-y-auto pr-2">
        {submission.text}
      </div>
      <div className="space-y-3">
        {CATEGORIES.map((c) => (
          <div key={c.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-zinc-400">{c.label}</label>
              <span className="font-mono text-xs text-white tabular-nums" data-testid={`score-${c.key}-value`}>
                {scores[c.key]}/10
              </span>
            </div>
            <input
              type="range"
              min="1" max="10" step="1"
              value={scores[c.key]}
              onChange={(e) => setScores({ ...scores, [c.key]: Number(e.target.value) })}
              data-testid={`score-${c.key}-slider`}
              className="w-full accent-white"
            />
          </div>
        ))}
      </div>
      <textarea
        placeholder="Optional feedback (won't be shown until results)…"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        data-testid="score-feedback"
        className="mt-4 w-full bg-zinc-950 hairline rounded-md p-3 text-sm placeholder:text-zinc-600 resize-none h-16 focus:outline-none focus:border-zinc-500"
      />
      <div className="flex items-center justify-between mt-4">
        <div className="font-mono text-xs text-zinc-400 tabular-nums">TOTAL · {total}/40</div>
        <button
          onClick={submit}
          disabled={submitting}
          data-testid={`submit-score-${submission.submission_id}`}
          className="bg-white text-black px-4 h-9 rounded-md font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Submit Score"}
        </button>
      </div>
    </div>
  );
}
