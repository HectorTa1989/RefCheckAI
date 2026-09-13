import { interpolate, Easing } from "remotion";

/** Apple-ish ease. */
export const EASE = Easing.bezier(0.32, 0.72, 0, 1);
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Value ramped from a→b between two frames, clamped. */
export const ramp = (
  frame: number,
  from: number,
  to: number,
  a: number,
  b: number,
  easing = EASE,
) =>
  interpolate(frame, [from, to], [a, b], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Fade in, hold, fade out. */
export const inOut = (
  frame: number,
  start: number,
  end: number,
  fade = 10,
) =>
  interpolate(
    frame,
    [start, start + fade, end - fade, end],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE },
  );

/** Characters of `text` revealed between two frames. */
export const typed = (
  frame: number,
  text: string,
  from: number,
  to: number,
) => {
  const n = Math.round(
    interpolate(frame, [from, to], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.linear,
    }),
  );
  return text.slice(0, n);
};

/** True once `frame` has passed `at`. */
export const after = (frame: number, at: number) => frame >= at;
