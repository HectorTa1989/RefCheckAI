import React, { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import manifest from "./audio-manifest.json";
import { BASE_SCALE, C, FONT, TITLEBAR, VIEWPORT } from "./theme";

/* ───────────────────────── types ───────────────────────── */

export type Rect = { x: number; y: number; w: number; h: number };

/** One cursor keyframe: start moving at `at`, arrive `travel` frames later. */
export type Key = {
  at: number;
  /** `data-t` id of the element to aim at (measured, not hand-placed) */
  t?: string;
  /** fixed viewport position, when there is no element to aim at */
  x?: number;
  y?: number;
  /** offset from the element's centre */
  dx?: number;
  dy?: number;
  travel?: number;
  click?: boolean;
  /** frames between arriving and clicking */
  clickDelay?: number;
};

export type Tone = "blue" | "green" | "amber" | "red";

/** A state change to outline: element `t` (its `data-hl` id) from frame `at`. */
export type HL = { t: string; at: number; hold?: number; tone?: Tone; pad?: number; radius?: number };

/** Characters typed into a field, for the key-click sound. */
export type Typing = { from: number; text: string; cps?: number };

export type Place = { scale?: number; x?: number; y?: number; opacity?: number };

const TRAVEL = 18;
const CLICK_DELAY = 4;

export const arrival = (k: Key) => k.at + (k.travel ?? TRAVEL);
export const clickFrame = (k: Key) => arrival(k) + (k.clickDelay ?? CLICK_DELAY);

/** Frames at which a typed string has revealed `n` characters. */
export const typed = (frame: number, spec: Typing) => {
  const cps = spec.cps ?? 16;
  const n = Math.floor(Math.max(0, frame - spec.from) * (cps / 30));
  return spec.text.slice(0, Math.min(spec.text.length, n));
};
export const typingDone = (spec: Typing) => spec.from + Math.ceil((spec.text.length * 30) / (spec.cps ?? 16));

const TONES: Record<Tone, string> = {
  blue: C.blue,
  green: C.green,
  amber: C.orange,
  red: C.red,
};

/* ───────────────────────── chrome ───────────────────────── */

export const Backdrop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(1300px 820px at 50% 0%, #FFFFFF 0%, #EEF0F4 48%, #DFE3EA 100%)",
      fontFamily: FONT,
    }}
  >
    <AbsoluteFill
      style={{
        background: "radial-gradient(900px 420px at 50% 104%, rgba(0,113,227,0.14), rgba(0,113,227,0) 70%)",
      }}
    />
    {children}
  </AbsoluteFill>
);

const Lock: React.FC = () => (
  <svg width="9" height="10" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="#6E6E73" strokeWidth="2.4" />
    <path d="M8 10V7a4 4 0 018 0v3" stroke="#6E6E73" strokeWidth="2.4" />
  </svg>
);

/** macOS browser chrome. `loading` 0..1 draws the navigation progress bar. */
export const AppWindow: React.FC<{
  url: string;
  loading?: number;
  selected?: boolean;
  children: React.ReactNode;
}> = ({ url, loading = 0, selected, children }) => (
  <div
    style={{
      width: VIEWPORT.w,
      height: VIEWPORT.h + TITLEBAR,
      borderRadius: 14,
      overflow: "hidden",
      background: "#fff",
      boxShadow:
        "0 44px 110px rgba(15,23,42,0.30), 0 10px 30px rgba(15,23,42,0.16), 0 0 0 1px rgba(0,0,0,0.07)",
      fontFamily: FONT,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        height: TITLEBAR,
        flexShrink: 0,
        background: "linear-gradient(#EDEDEF, #E4E4E7)",
        borderBottom: "1px solid #D4D4D8",
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 8,
        position: "relative",
      }}
    >
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
      ))}
      <div
        data-t="urlbar"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: 480,
          height: 25,
          borderRadius: 7,
          background: "#FAFAFB",
          border: "1px solid #D9D9DE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 12.5,
          color: "#3A3A3C",
          fontWeight: 500,
          letterSpacing: "-0.1px",
        }}
      >
        <Lock />
        <span
          style={{
            background: selected ? "rgba(0,113,227,0.28)" : "transparent",
            borderRadius: 3,
            padding: "0 2px",
          }}
        >
          {url}
        </span>
      </div>
      {loading > 0 && loading < 1 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: -1,
            height: 2.5,
            width: `${loading * 100}%`,
            background: C.blue,
            borderRadius: 2,
          }}
        />
      )}
    </div>
    {children}
  </div>
);

/* ───────────────────────── measurement ───────────────────────── */

function rectIn(el: Element, vp: DOMRect, s: number): Rect {
  const r = el.getBoundingClientRect();
  return { x: (r.left - vp.left) / s, y: (r.top - vp.top) / s, w: r.width / s, h: r.height / s };
}

const same = (a: Record<string, Rect>, b: Record<string, Rect>) => {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => {
    const p = a[k];
    const q = b[k];
    return q && Math.abs(p.x - q.x) < 0.25 && Math.abs(p.y - q.y) < 0.25 && Math.abs(p.w - q.w) < 0.25 && Math.abs(p.h - q.h) < 0.25;
  });
};

/* ───────────────────────── cursor ───────────────────────── */

const Pointer: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg
    width="26"
    height="34"
    viewBox="0 0 26 34"
    style={{
      position: "absolute",
      left: x - 3,
      top: y - 2,
      transform: `scale(${press})`,
      transformOrigin: "3px 2px",
      pointerEvents: "none",
      zIndex: 9999,
      filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.32))",
    }}
  >
    <path
      d="M3 2.2 L3 24.4 L8.9 19.1 L12.5 27.9 L16.4 26.2 L12.8 17.6 L20.6 17.2 Z"
      fill="#FFFFFF"
      stroke="#1D1D1F"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const Ripple: React.FC<{ x: number; y: number; since: number }> = ({ x, y, since }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 12,
      height: 12,
      marginLeft: -6,
      marginTop: -6,
      borderRadius: "50%",
      border: `2.5px solid ${C.blue}`,
      transform: `scale(${interpolate(since, [0, 20], [0.5, 5.2], { extrapolateRight: "clamp" })})`,
      opacity: interpolate(since, [0, 20], [0.8, 0], { extrapolateRight: "clamp" }),
      pointerEvents: "none",
      zIndex: 9998,
    }}
  />
);

/* ───────────────────────── highlight ───────────────────────── */

const Box: React.FC<{ r: Rect; frame: number; h: HL }> = ({ r, frame, h }) => {
  const hold = h.hold ?? 46;
  const since = frame - h.at;
  const t =
    since < 0 ? 0 : since < 7 ? since / 7 : since < hold ? 1 : Math.max(0, 1 - (since - hold) / 12);
  if (t <= 0) return null;
  const pad = h.pad ?? 6;
  const color = TONES[h.tone ?? "blue"];
  const grow = since < 7 ? 1 + (1 - since / 7) * 0.04 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: r.x - pad,
        top: r.y - pad,
        width: r.w + pad * 2,
        height: r.h + pad * 2,
        borderRadius: h.radius ?? 14,
        border: `2.5px solid ${color}`,
        boxShadow: `0 0 0 5px ${color}26, 0 0 22px 3px ${color}55`,
        opacity: t,
        transform: `scale(${grow})`,
        transformOrigin: "center",
        pointerEvents: "none",
        zIndex: 9000,
      }}
    />
  );
};

/* ───────────────────────── stage ───────────────────────── */

/**
 * A scene: the app window showing `UI` at the current frame, plus the cursor,
 * highlight boxes and interaction sounds. `UI` must derive everything from
 * useCurrentFrame(), so a <Freeze> copy of it shows the same layout at any
 * frame — that is how the cursor finds where an element *will* be when it
 * arrives, without hand-placed coordinates.
 */
export const ScreenStage: React.FC<{
  url: string | ((f: number) => string);
  UI: React.FC;
  keys?: Key[];
  hls?: HL[];
  typing?: Typing[];
  hideCursor?: (f: number) => boolean;
  place?: (f: number) => Place;
  loading?: (f: number) => number;
  urlSelected?: (f: number) => boolean;
}> = ({ url, UI, keys = [], hls = [], typing = [], hideCursor, place, loading, urlSelected }) => {
  const frame = useCurrentFrame();
  const vpRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const probes = useRef(new Map<string, HTMLDivElement>());
  const [rects, setRects] = useState<Record<string, Rect>>({});

  // Which keyframe segment are we in?
  let seg = 0;
  keys.forEach((k, i) => {
    if (frame >= k.at) seg = i;
  });
  const needed = [keys[seg - 1], keys[seg]].filter((k): k is Key => !!k && !!k.t);
  const probeKey = (k: Key) => `${k.t}@${arrival(k)}`;
  const activeHls = hls.filter((h) => frame >= h.at && frame <= h.at + (h.hold ?? 46) + 12);

  useLayoutEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const vr = vp.getBoundingClientRect();
    const s = vr.width / VIEWPORT.w;
    const next: Record<string, Rect> = {};
    probes.current.forEach((layer, key) => {
      const id = key.slice(0, key.lastIndexOf("@"));
      const el = layer.querySelector(`[data-t="${id}"]`);
      if (el) next[key] = rectIn(el, vr, s);
    });
    const live = liveRef.current;
    if (live) {
      for (const h of activeHls) {
        const el = live.querySelector(`[data-hl="${h.t}"]`);
        if (el) next[`hl:${h.t}`] = rectIn(el, vr, s);
      }
    }
    if (!same(next, rects)) setRects(next);
  });

  const pos = (k: Key | undefined) => {
    if (!k) return null;
    if (k.t) {
      const r = rects[probeKey(k)];
      return r ? { x: r.x + r.w / 2 + (k.dx ?? 0), y: r.y + r.h / 2 + (k.dy ?? 0) } : null;
    }
    return { x: k.x ?? VIEWPORT.w / 2, y: k.y ?? VIEWPORT.h / 2 };
  };

  let cursor: { x: number; y: number } | null = null;
  if (keys.length) {
    const to = pos(keys[seg]);
    const from = seg > 0 ? pos(keys[seg - 1]) : to;
    if (to && from) {
      const k = keys[seg];
      const t =
        arrival(k) <= k.at
          ? 1
          : interpolate(frame, [k.at, arrival(k)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.3, 0.05, 0.2, 1),
            });
      cursor = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    }
  }

  const clicks = keys.filter((k) => k.click).map((k) => ({ f: clickFrame(k), k }));
  const lastClick = clicks.filter((c) => frame >= c.f).pop();
  const since = lastClick ? frame - lastClick.f : 999;
  const press = since < 8 ? interpolate(since, [0, 3, 8], [1, 0.84, 1]) : 1;
  const clickPos = lastClick ? pos(lastClick.k) : null;

  const p = place ? place(frame) : {};
  const scale = BASE_SCALE * (p.scale ?? 1);
  const hidden = hideCursor ? hideCursor(frame) : false;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          transform: `translate(${p.x ?? 0}px, ${p.y ?? 0}px) scale(${scale})`,
          opacity: p.opacity ?? 1,
        }}
      >
        <AppWindow
          url={typeof url === "function" ? url(frame) : url}
          loading={loading ? loading(frame) : 0}
          selected={urlSelected ? urlSelected(frame) : false}
        >
          <div
            ref={vpRef}
            style={{
              position: "relative",
              width: VIEWPORT.w,
              height: VIEWPORT.h,
              overflow: "hidden",
              background: C.fill4,
              color: C.text,
              fontSize: 15,
              lineHeight: 1.47,
              fontFamily: FONT,
            }}
          >
            <div ref={liveRef} style={{ position: "absolute", inset: 0 }}>
              <UI />
            </div>

            {needed.map((k) => (
              <div
                key={probeKey(k)}
                ref={(el) => {
                  if (el) probes.current.set(probeKey(k), el);
                  else probes.current.delete(probeKey(k));
                }}
                aria-hidden
                // opacity, not visibility: a child with `visibility: visible` would show through.
                style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
              >
                <Freeze frame={arrival(k)}>
                  <UI />
                </Freeze>
              </div>
            ))}

            {activeHls.map((h) => {
              const r = rects[`hl:${h.t}`];
              return r ? <Box key={`${h.t}${h.at}`} r={r} frame={frame} h={h} /> : null;
            })}
          </div>
        </AppWindow>

        {/* Window-level layer, so the pointer can also reach the browser chrome. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: TITLEBAR,
            width: VIEWPORT.w,
            height: VIEWPORT.h,
            pointerEvents: "none",
          }}
        >
          {!hidden && lastClick && clickPos && since < 20 && <Ripple x={clickPos.x} y={clickPos.y} since={since} />}
          {!hidden && cursor && <Pointer x={cursor.x} y={cursor.y} press={press} />}
        </div>
      </div>

      {clicks.map((c, i) => (
        <Sequence key={`c${i}`} from={c.f} durationInFrames={6} layout="none">
          <Audio src={staticFile(manifest.sfx.click.file)} volume={0.5} />
        </Sequence>
      ))}
      {typing.flatMap((spec, i) =>
        spec.text.split("").map((ch, j) =>
          ch === " " || j % 2 ? null : (
            <Sequence
              key={`k${i}-${j}`}
              from={spec.from + Math.round((j * 30) / (spec.cps ?? 16))}
              durationInFrames={3}
              layout="none"
            >
              <Audio src={staticFile(manifest.sfx.key.file)} volume={0.16} />
            </Sequence>
          ),
        ),
      )}
    </AbsoluteFill>
  );
};
