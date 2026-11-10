"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber, cn } from "@/lib/utils";

interface StatCounterProps {
  value: number;
  label: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export default function StatCounter({
  value,
  label,
  suffix = "",
  className,
  duration = 1800,
}: StatCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <div ref={ref} className={cn("text-center", className)}>
      <div className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tabular-nums">
        {formatNumber(count)}
        {suffix}
      </div>
      <div className="mt-2 text-sm sm:text-base text-white/60 font-medium">
        {label}
      </div>
    </div>
  );
}
