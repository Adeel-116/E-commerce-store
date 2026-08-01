"use client";

import { useEffect, useRef, useState } from "react";
import "../styles/LoadingRing.css";

const TICK_COUNT = 24;
// Ceiling for the progress animation while `active` — it counts up toward
// 99% over this long and holds there, since we don't know the real duration
// of whatever async work the caller is waiting on. The caller flips
// `active` to false once that work actually finishes.
const MAX_ANIMATE_MS = 8000;

export default function LoadingRing({ active }: { active: boolean }) {
  const [percent, setPercent] = useState(0);
  const shownAt = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setPercent(100);
      if (frame.current) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      return;
    }

    shownAt.current = performance.now();
    setPercent(0);

    const tick = (now: number) => {
      const elapsed = now - shownAt.current;
      const next = Math.min(99, Math.floor((elapsed / MAX_ANIMATE_MS) * 100));
      setPercent(next);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [active]);

  const filledTicks = Math.round((percent / 100) * TICK_COUNT);
  const radius = 42;
  const center = 50;

  return (
    <div className="loading-ring">
      <svg viewBox="0 0 100 100">
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const angle = (i / TICK_COUNT) * 2 * Math.PI;
          const inner = radius - 8;
          const outer = radius;
          const x1 = center + inner * Math.cos(angle);
          const y1 = center + inner * Math.sin(angle);
          const x2 = center + outer * Math.cos(angle);
          const y2 = center + outer * Math.sin(angle);
          const isFilled = i < filledTicks;
          const isCurrent = i === filledTicks - 1;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={`lr-tick${isFilled ? " is-filled" : ""}${isCurrent ? " is-current" : ""}`}
            />
          );
        })}
      </svg>
      <div className="lr-percent">{percent}%</div>
    </div>
  );
}
