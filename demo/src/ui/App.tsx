import React from "react";
import { Phone, LayoutDashboard, ListChecks, LogOut } from "lucide-react";
import { C, FONT, SHADOW, scoreColor } from "../theme";

/* ─────────── Sidebar (ported from frontend/components/Sidebar.tsx) ────────── */

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/checks/new", label: "New Check", Icon: Phone },
  { href: "/templates", label: "Templates", Icon: ListChecks },
];

export const Sidebar: React.FC<{ active: string }> = ({ active }) => (
  <aside
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: 240,
      background: "rgba(255,255,255,0.88)",
      backdropFilter: "blur(20px) saturate(180%)",
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      zIndex: 100,
    }}
  >
    <div style={{ padding: "24px 20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, #0071E3, #0056B0)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Phone size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
            RefCheck AI
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.blue,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Admin
          </div>
        </div>
      </div>
    </div>

    <div style={{ height: 1, background: C.border2, margin: "0 20px" }} />

    <nav style={{ flex: 1, padding: "12px 12px 0" }}>
      {NAV.map(({ href, label, Icon }) => {
        const on = href === active;
        return (
          <div
            key={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: on ? 600 : 400,
              color: on ? C.blue : C.text,
              background: on ? "rgba(0,113,227,0.08)" : "transparent",
              marginBottom: 2,
            }}
          >
            <Icon size={18} strokeWidth={on ? 2.2 : 1.8} />
            {label}
          </div>
        );
      })}
    </nav>

    <div style={{ padding: 12, borderTop: `1px solid ${C.border2}` }}>
      <div style={{ fontSize: 12, color: C.secondary, padding: "8px 12px" }}>
        sarah@northwind.io
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderRadius: 10,
          color: C.secondary,
          fontSize: 14,
        }}
      >
        <LogOut size={16} />
        Sign out
      </div>
    </div>
  </aside>
);

/* ─────────── Page shell ─────────── */

export const Page: React.FC<{
  active: string;
  children: React.ReactNode;
}> = ({ active, children }) => (
  <div style={{ width: "100%", height: "100%", fontFamily: FONT, position: "relative" }}>
    <Sidebar active={active} />
    <div
      style={{
        marginLeft: 240,
        height: "100%",
        padding: "34px 44px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 900 }}>{children}</div>
    </div>
  </div>
);

/* ─────────── ScoreRing (ported from frontend/components/ScoreRing.tsx) ────── */

export const ScoreRing: React.FC<{
  score: number;
  size?: number;
  strokeWidth?: number;
  sublabel?: string;
  progress?: number;
}> = ({ score, size = 96, strokeWidth = 8, sublabel, progress = 1 }) => {
  const color = scoreColor(score);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / 10)) * progress;
  const offset = circumference * (1 - pct);
  const fontSize = size < 80 ? size * 0.26 : size * 0.22;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: "block", transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.border2}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {(score * progress).toFixed(1)}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: fontSize * 0.52,
              color: C.secondary,
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────── RecommendationBadge ─────────── */

const REC: Record<string, { label: string; color: string; bg: string }> = {
  strong_yes: { label: "Strong Yes", color: C.green, bg: C.greenLt },
  yes: { label: "Yes", color: C.green, bg: C.greenLt },
  neutral: { label: "Neutral", color: C.orange, bg: C.orangeLt },
  no: { label: "No", color: C.red, bg: C.redLt },
  strong_no: { label: "Strong No", color: C.red, bg: C.redLt },
};

export const RecBadge: React.FC<{ rec: string; size?: "sm" | "md" | "lg" }> = ({
  rec,
  size = "md",
}) => {
  const cfg = REC[rec];
  const pad = size === "sm" ? "3px 10px" : size === "lg" ? "7px 18px" : "5px 14px";
  const fs = size === "sm" ? 11 : size === "lg" ? 15 : 13;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: pad,
        borderRadius: 100,
        background: cfg.bg,
        color: cfg.color,
        fontSize: fs,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
};

/* ─────────── Buttons / inputs (globals.css classes, inlined) ─────────── */

export const BtnPrimary: React.FC<{
  children: React.ReactNode;
  hover?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}> = ({ children, hover, disabled, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: hover ? C.blueDk : C.blue,
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      padding: "10px 22px",
      borderRadius: 980,
      opacity: disabled ? 0.45 : 1,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

export const BtnSecondary: React.FC<{
  children: React.ReactNode;
  hover?: boolean;
  style?: React.CSSProperties;
}> = ({ children, hover, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: hover ? C.border : C.fill3,
      color: C.blue,
      fontSize: 15,
      fontWeight: 600,
      padding: "10px 22px",
      borderRadius: 980,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 13,
      fontWeight: 600,
      color: C.secondary,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    }}
  >
    {children}
  </div>
);

export const Input: React.FC<{
  value: string;
  placeholder: string;
  focused?: boolean;
  caret?: boolean;
}> = ({ value, placeholder, focused, caret }) => (
  <div
    style={{
      width: "100%",
      padding: "11px 14px",
      background: C.fill4,
      border: `1.5px solid ${focused ? C.blue : C.border}`,
      boxShadow: focused ? "0 0 0 3px rgba(0,113,227,0.15)" : "none",
      borderRadius: 10,
      fontSize: 15,
      color: value ? C.text : C.tertiary,
      boxSizing: "border-box",
      whiteSpace: "nowrap",
      overflow: "hidden",
    }}
  >
    {value || placeholder}
    {caret && (
      <span
        style={{
          display: "inline-block",
          width: 1.5,
          height: 16,
          background: C.blue,
          marginLeft: 1,
          verticalAlign: "-3px",
        }}
      />
    )}
  </div>
);

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  sm?: boolean;
}> = ({ children, style, sm }) => (
  <div
    style={{
      background: C.surface,
      borderRadius: sm ? 12 : 18,
      boxShadow: sm ? SHADOW.sm : SHADOW.md,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Soft highlight ring drawing the eye to the element being clicked. */
export const Spotlight: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  radius?: number;
}> = ({ x, y, w, h, opacity, radius = 999 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: radius,
      boxShadow: `0 0 0 3px rgba(0,113,227,${0.55 * opacity}), 0 0 22px 6px rgba(0,113,227,${
        0.3 * opacity
      })`,
      pointerEvents: "none",
      zIndex: 500,
    }}
  />
);

/** Marks a piece of UI that just CHANGED as a result of a click.
 *
 * Distinct from `Spotlight`, which points at something the narrator is
 * describing. This is the "look, that just happened" cue: it snaps in on the
 * frame the state changes, holds, then releases. `tone` carries meaning —
 * green for something added or completed, blue for a selection, amber for
 * work now in progress.
 */
export const ChangeBox: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  /** frame the state change happens on */
  at: number;
  frame: number;
  hold?: number;
  tone?: "blue" | "green" | "amber";
  radius?: number;
  label?: string;
}> = ({ x, y, w, h, at, frame, hold = 52, tone = "blue", radius = 12, label }) => {
  const color = tone === "green" ? C.green : tone === "amber" ? C.orange : C.blue;

  // snap in over 8 frames, hold, release over 14
  const t =
    frame < at
      ? 0
      : frame < at + 8
      ? (frame - at) / 8
      : frame < at + hold
      ? 1
      : Math.max(0, 1 - (frame - at - hold) / 14);
  if (t <= 0) return null;

  // slight overshoot as it lands, so the eye catches it
  const grow = frame < at + 8 ? 1 + (1 - (frame - at) / 8) * 0.035 : 1;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: radius,
          border: `2.5px solid ${color}`,
          boxShadow: `0 0 0 4px ${color}22, 0 0 18px 2px ${color}44`,
          transform: `scale(${grow})`,
          transformOrigin: "center",
          opacity: t,
          pointerEvents: "none",
          zIndex: 600,
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            left: x + w - 6,
            top: y - 24,
            transform: "translateX(-100%)",
            background: color,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.02em",
            padding: "3px 9px",
            borderRadius: 6,
            opacity: t,
            pointerEvents: "none",
            zIndex: 601,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
    </>
  );
};
