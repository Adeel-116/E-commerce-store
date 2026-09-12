"use client";

import "../styles/LoadingRing.css";

export default function LoadingRing({ active }: { active: boolean }) {
  return (
    <div className={`loading-ring${active ? " is-active" : ""}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="lr-track" cx="50" cy="50" r="43" />
        <circle className="lr-orbit" cx="50" cy="50" r="43" />
      </svg>
      <span className="lr-mark">Z</span>
    </div>
  );
}
