import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppWindow } from "./AppWindow";
import { C, FONT, VIEWPORT, TITLEBAR } from "../theme";
import { ramp } from "../anim";

/** Base scale that fits the 1320x820 window into a 1920x1080 frame. */
const BASE = 940 / (VIEWPORT.h + TITLEBAR);
/** push the window down so the top chapter pill never touches the chrome */
const DROP = 30;

export type Zoom = {
  /** viewport-space point to centre on */
  x: number;
  y: number;
  scale: number;
  from: number;
  to: number;
};

export const Backdrop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(1200px 800px at 50% 8%, #FFFFFF 0%, #F2F3F6 42%, #E4E7EE 100%)",
      fontFamily: FONT,
    }}
  >
    {/* soft brand glow */}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(760px 460px at 50% 96%, rgba(0,113,227,0.16), rgba(0,113,227,0) 70%)",
      }}
    />
    {children}
  </AbsoluteFill>
);

/**
 * Renders the app window centred in the frame, optionally zooming toward a
 * point in viewport coordinates. `children` are placed inside the viewport, so
 * cursor coordinates are plain 1320x780 app pixels.
 */
export const Stage: React.FC<{
  url?: string;
  children: React.ReactNode;
  /** at most one active zoom */
  zoom?: Zoom;
  /** entry lift, in frames */
  enterAt?: number;
}> = ({ url, children, zoom, enterAt = 0 }) => {
  const frame = useCurrentFrame();

  let scale = BASE;
  let tx = 0;
  let ty = 0;

  if (zoom) {
    const t = ramp(frame, zoom.from, zoom.to, 0, 1);
    const z = 1 + (zoom.scale - 1) * t;
    scale = BASE * z;
    // shift so (zoom.x, zoom.y) in viewport space moves toward frame centre
    const cx = VIEWPORT.w / 2;
    const cy = (VIEWPORT.h + TITLEBAR) / 2;
    tx = (cx - zoom.x) * (z - 1) * BASE;
    ty = (cy - (zoom.y + TITLEBAR)) * (z - 1) * BASE;
  }

  const enter = ramp(frame, enterAt, enterAt + 22, 0, 1);
  const lift = (1 - enter) * 26;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          transform: `translate(${tx}px, ${ty + lift + DROP}px) scale(${scale})`,
          opacity: 0.15 + enter * 0.85,
          willChange: "transform",
        }}
      >
        <AppWindow url={url}>{children}</AppWindow>
      </div>
    </AbsoluteFill>
  );
};

/** Lower-third caption strip. */
export const Caption: React.FC<{
  title: string;
  sub?: string;
  opacity: number;
}> = ({ title, sub, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 40,
      display: "flex",
      justifyContent: "center",
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        background: "rgba(20,20,22,0.86)",
        backdropFilter: "blur(14px)",
        borderRadius: 14,
        padding: sub ? "13px 26px 15px" : "13px 26px",
        textAlign: "center",
        boxShadow: "0 12px 40px rgba(0,0,0,0.28)",
        transform: `translateY(${(1 - opacity) * 14}px)`,
        maxWidth: 1100,
      }}
    >
      <div style={{ color: "#fff", fontSize: 28, fontWeight: 650, letterSpacing: "-0.4px" }}>
        {title}
      </div>
      {sub && (
        <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 18, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  </div>
);

/** Small pill badge floating over the stage (e.g. "Step 2 of 4"). */
export const StepPill: React.FC<{ text: string; opacity: number }> = ({ text, opacity }) => (
  <div
    style={{
      position: "absolute",
      top: 24,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        background: "rgba(255,255,255,0.9)",
        border: `1px solid ${C.border}`,
        borderRadius: 999,
        padding: "7px 20px",
        fontSize: 17,
        fontWeight: 650,
        color: C.text,
        boxShadow: "0 6px 22px rgba(0,0,0,0.10)",
        letterSpacing: "-0.2px",
      }}
    >
      {text}
    </div>
  </div>
);
