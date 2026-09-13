/** v2 walkthrough tokens. Colours are the app's own (frontend/app/globals.css). */
export { C, SHADOW, scoreColor } from "../theme";

/** Inter stands in for SF Pro, which the real app uses on a Mac. */
export const FONT =
  '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
export const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

export const FPS = 30;
export const W = 1920;
export const H = 1080;

/** The browser viewport the app is laid out in, in CSS pixels. */
export const VIEWPORT = { w: 1320, h: 780 };
export const TITLEBAR = 40;

/** Scale that fits the window (viewport + title bar) into the 1080p frame. */
export const BASE_SCALE = 980 / (VIEWPORT.h + TITLEBAR);

export const sec = (s: number) => Math.round(s * FPS);
