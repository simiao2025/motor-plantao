"use client";

/**
 * HeartbeatLine — Animated ECG/cardiac monitor line.
 *
 * Renders a looping SVG heartbeat pulse that travels left-to-right,
 * with a glowing neon trail. Color is driven by `status`:
 *   • "connected"    → emerald green
 *   • "disconnected"  → rose red  (flat-line style)
 *   • "checking"      → slate gray (subtle pulse)
 */

import { useId } from "react";

type HeartbeatStatus = "connected" | "disconnected" | "checking";

interface HeartbeatLineProps {
  status: HeartbeatStatus;
  className?: string;
}

const palette = {
  connected:    { stroke: "#34d399", glow: "#34d399", bg: "transparent" },
  disconnected: { stroke: "#f43f5e", glow: "#f43f5e", bg: "transparent" },
  checking:     { stroke: "#64748b", glow: "#64748b", bg: "transparent" },
} as const;

// The ECG waveform path — repeating heartbeat cycles across 600-unit viewbox
const ECG_PATH =
  "M0,30 L40,30 L50,30 L55,10 L60,50 L65,5 L70,55 L75,25 L85,30 L120,30 " +
  "L160,30 L170,30 L175,10 L180,50 L185,5 L190,55 L195,25 L205,30 L240,30 " +
  "L280,30 L290,30 L295,10 L300,50 L305,5 L310,55 L315,25 L325,30 L360,30 " +
  "L400,30 L410,30 L415,10 L420,50 L425,5 L430,55 L435,25 L445,30 L480,30 " +
  "L520,30 L530,30 L535,10 L540,50 L545,5 L550,55 L555,25 L565,30 L600,30";

// Flat-line path for disconnected state
const FLAT_PATH = "M0,30 L600,30";

export function HeartbeatLine({ status, className = "" }: HeartbeatLineProps) {
  const id = useId();
  const colors = palette[status];
  const isDisconnected = status === "disconnected";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 600 60"
        className="w-[200%] h-full"
        preserveAspectRatio="none"
        style={{
          animation: isDisconnected ? "none" : "heartbeat-scroll 3s linear infinite",
        }}
      >
        <defs>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow layer */}
        <path
          d={isDisconnected ? FLAT_PATH : ECG_PATH}
          fill="none"
          stroke={colors.glow}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          filter={`url(#glow-${id})`}
        />
        {/* Main crisp line */}
        <path
          d={isDisconnected ? FLAT_PATH : ECG_PATH}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Right-edge fade mask */}
      <div
        className="absolute right-0 top-0 h-full w-8 pointer-events-none"
        style={{
          background: `linear-gradient(to right, transparent, var(--color-s1, #0a0a0f))`,
        }}
      />
      {/* Left-edge fade mask */}
      <div
        className="absolute left-0 top-0 h-full w-6 pointer-events-none"
        style={{
          background: `linear-gradient(to left, transparent, var(--color-s1, #0a0a0f))`,
        }}
      />

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes heartbeat-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
