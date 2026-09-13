import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_OUT } from "../anim";

export type Move = { at: number; x: number; y: number; travel?: number };

/** frames a pointer takes to reach its target before dwelling there */
const TRAVEL = 22;
export type Click = { at: number };

/**
 * Position at `frame`. Each keyframe means "start moving toward (x,y) at `at`,
 * arrive `travel` frames later, then hold there until the next keyframe" — so
 * the pointer is actually resting on a control when its click fires.
 */
export function cursorAt(frame: number, moves: Move[]) {
  if (moves.length === 0) return { x: 0, y: 0 };
  let from = moves[0];
  let to = moves[0];
  for (const m of moves) {
    if (frame >= m.at) {
      from = to;
      to = m;
    }
  }
  if (from === to) return { x: to.x, y: to.y };
  const t = interpolate(frame, [to.at, to.at + (to.travel ?? TRAVEL)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

/** Animated pointer + click ripple, drawn in app-viewport coordinates. */
export const Cursor: React.FC<{
  moves: Move[];
  clicks?: number[];
  hide?: boolean;
}> = ({ moves, clicks = [], hide }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, y } = cursorAt(frame, moves);

  const lastClick = [...clicks].filter((c) => frame >= c).pop();
  const sinceClick = lastClick === undefined ? 999 : frame - lastClick;

  // slight press-down scale on click
  const press =
    sinceClick < 8
      ? interpolate(sinceClick, [0, 3, 8], [1, 0.82, 1], {
          extrapolateRight: "clamp",
        })
      : 1;

  const appear = spring({
    frame: frame - (moves[0]?.at ?? 0) + 6,
    fps,
    config: { damping: 200 },
    durationInFrames: 12,
  });

  if (hide) return null;

  return (
    <>
      {/* click ripple */}
      {sinceClick < 22 && (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            borderRadius: "50%",
            border: "2.5px solid rgba(0,113,227,0.85)",
            transform: `scale(${interpolate(sinceClick, [0, 22], [0.6, 7], {
              extrapolateRight: "clamp",
            })})`,
            opacity: interpolate(sinceClick, [0, 22], [0.75, 0], {
              extrapolateRight: "clamp",
            }),
            pointerEvents: "none",
            zIndex: 9998,
          }}
        />
      )}

      {/* pointer */}
      <svg
        width="26"
        height="34"
        viewBox="0 0 26 34"
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `scale(${appear * press})`,
          transformOrigin: "3px 3px",
          pointerEvents: "none",
          zIndex: 9999,
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.34))",
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
    </>
  );
};
