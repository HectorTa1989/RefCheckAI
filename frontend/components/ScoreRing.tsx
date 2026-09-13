"use client";
import { useEffect, useRef } from "react";

interface ScoreRingProps {
  score: number;         // 0–10
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showValue?: boolean;
  animate?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 7.5) return "#34C759";
  if (score >= 5.5) return "#FF9F0A";
  return "#FF3B30";
}

export default function ScoreRing({
  score,
  size = 96,
  strokeWidth = 8,
  label,
  sublabel,
  showValue = true,
  animate = true,
}: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const color = scoreColor(score);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / 10));
  const offset = circumference * (1 - pct);

  useEffect(() => {
    if (!animate || !circleRef.current) return;
    const el = circleRef.current;
    // Start fully empty, animate to target
    el.style.transition = "none";
    el.style.strokeDashoffset = String(circumference);
    // Force reflow
    void el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)";
    el.style.strokeDashoffset = String(offset);
  }, [score, animate, circumference, offset]);

  const cx = size / 2;
  const cy = size / 2;
  const fontSize = size < 80 ? size * 0.26 : size * 0.22;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: "block", transform: "rotate(-90deg)" }}
        aria-label={`Score: ${score.toFixed(1)} out of 10`}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#E5E5EA"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          style={{
            filter: `drop-shadow(0 0 6px ${color}55)`,
          }}
        />
      </svg>

      {showValue && (
        <div style={{ textAlign: "center", lineHeight: 1 }}>
          <div
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              top: "50%",
              left: "50%",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Overlaid text — separate absolutely positioned container */}
      <div
        style={{
          position: "relative",
          marginTop: `-${size + 6}px`,
          width: size,
          height: size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {showValue && (
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color,
              letterSpacing: "-0.02em",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              lineHeight: 1,
            }}
          >
            {score > 0 ? score.toFixed(1) : "—"}
          </div>
        )}
        {sublabel && (
          <div
            style={{
              fontSize: `${fontSize * 0.52}px`,
              color: "#6E6E73",
              marginTop: "2px",
              fontWeight: 500,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>

      {label && (
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#6E6E73",
            textAlign: "center",
            marginTop: `${size}px`,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}


// ── Compact inline score pill ──────────────────────────────────────────────

export function ScorePill({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "2px 8px",
        borderRadius: "100px",
        background: `${color}18`,
        color,
        fontSize: "13px", fontWeight: 700,
        letterSpacing: "-0.01em",
      }}
    >
      {score.toFixed(1)}
    </span>
  );
}
