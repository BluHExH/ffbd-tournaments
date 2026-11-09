"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  target: string;
  className?: string;
  compact?: boolean;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function CountdownTimer({
  target,
  className,
  compact = false,
}: CountdownTimerProps) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, ended: false });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setTime({ h: 0, m: 0, s: 0, ended: true });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s, ended: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (time.ended) {
    return (
      <span className={cn("text-xs font-semibold text-red-400", className)}>
        Started
      </span>
    );
  }

  if (compact) {
    return (
      <span className={cn("font-mono text-sm font-semibold tabular-nums", className)}>
        {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[
        { v: time.h, l: "H" },
        { v: time.m, l: "M" },
        { v: time.s, l: "S" },
      ].map((u, i) => (
        <div key={u.l} className="flex items-center gap-1">
          {i > 0 && <span className="text-white/40 font-bold">:</span>}
          <div className="flex flex-col items-center">
            <span className="font-mono text-base font-bold tabular-nums leading-none">
              {pad(u.v)}
            </span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">
              {u.l}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
