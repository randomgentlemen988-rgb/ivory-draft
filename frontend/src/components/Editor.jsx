import React, { useEffect, useState, useRef } from "react";

export default function Editor({ value, onChange, disabled, minWords, maxWords, placeholder, autosaveKey }) {
  const ref = useRef(null);
  const [focusMode, setFocusMode] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    if (!autosaveKey) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(autosaveKey, value || ""); } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [value, autosaveKey]);

  const wordCount = (value || "").trim().split(/\s+/).filter(Boolean).length;
  const inRange = wordCount >= minWords && wordCount <= maxWords;
  const tooFew = wordCount < minWords;
  const tooMany = wordCount > maxWords;

  return (
    <div className="relative" data-testid="writing-editor-wrapper">
      <textarea
        ref={ref}
        data-testid="writing-editor"
        className="ivory-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onFocus={() => setFocusMode(true)}
        onBlur={() => setFocusMode(false)}
        placeholder={placeholder || "Begin your draft. Press anything to start writing."}
        spellCheck={true}
      />
      <div className={`hairline-t flex items-center justify-between px-1 py-3 mt-4 transition-opacity ${focusMode ? "opacity-40" : "opacity-100"}`}>
        <div className="font-mono text-[10px] tracking-[0.25em] text-zinc-500">
          AUTO-SAVED · LOCAL DRAFT
        </div>
        <div className="font-mono text-xs tabular-nums" data-testid="word-count">
          <span className={tooFew ? "text-amber-400" : tooMany ? "text-red-400" : "text-emerald-400"}>
            {wordCount}
          </span>
          <span className="text-zinc-600"> / {minWords}–{maxWords} WORDS</span>
        </div>
      </div>
      {!inRange && !disabled && (
        <div className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 mt-1">
          {tooFew ? `${minWords - wordCount} MORE WORDS TO REACH MINIMUM` : `${wordCount - maxWords} WORDS OVER MAXIMUM`}
        </div>
      )}
    </div>
  );
}
