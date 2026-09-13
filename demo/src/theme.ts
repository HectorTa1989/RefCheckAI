/** Design tokens lifted verbatim from the RefCheck AI app
 *  (frontend/app/globals.css + frontend/tailwind.config.ts). */
export const C = {
  blue: "#0071E3",
  blueDk: "#0056B0",
  blueLt: "#E8F2FD",
  text: "#1D1D1F",
  secondary: "#6E6E73",
  tertiary: "#AEAEB2",
  fill4: "#F5F5F7",
  fill3: "#EBEBED",
  border: "#D2D2D7",
  border2: "#E5E5EA",
  surface: "#FFFFFF",
  green: "#34C759",
  greenLt: "#E8F9EE",
  greenDk: "#1A7F3C",
  red: "#FF3B30",
  redLt: "#FEE8E8",
  redDk: "#B91C1C",
  orange: "#FF9F0A",
  orangeLt: "#FFF4E5",
  purple: "#AF52DE",
} as const;

export const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

export const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

export const SHADOW = {
  sm: "0 1px 4px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)",
  md: "0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04)",
  lg: "0 8px 32px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.04)",
};

/** Internal browser-viewport size the app is laid out in. */
export const VIEWPORT = { w: 1320, h: 780 };
export const TITLEBAR = 40;

export function scoreColor(score: number): string {
  if (score >= 7.5) return C.green;
  if (score >= 5.5) return C.orange;
  return C.red;
}
