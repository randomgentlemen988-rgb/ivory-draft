import React, { useEffect, useState } from "react";

export default function Timer({ endsAt, onExpire, warningSeconds = 60 }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const end = endsAt ? new Date(endsAt).getTime() : null;
  const remaining = end ? Math.max(0, end - now) : 0;
  const totalSec = Math.floor(remaining / 1000);
  const expired = end ? totalSec <= 0 : false;

  useEffect(() => {
    if (expired && onExpire) onExpire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  if (!endsAt) return null;

  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const warn = totalSec <= warningSeconds && totalSec > 0;

  return (
    <div className="font-mono tabular-nums text-4xl md:text-6xl font-medium tracking-tight" data-testid="game-timer">
      <span className={warn ? "animate-pulse-red" : "text-white"}>
        {mm}:{ss}
      </span>
    </div>
  );
}
