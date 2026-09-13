/**
 * Walkthrough timeline (30 fps). Segment lengths were fitted to the measured
 * narration and call audio in audio-manifest.json; `NARRATION` places each
 * clip inside its segment. Keep every clip ending before its segment does.
 */
import manifest from "./audio-manifest.json";

const ORDER = [
  ["login", 294],
  ["dashboard", 186],
  ["templates", 270],
  ["step1", 204],
  ["step2", 328],
  ["step3", 80],
  ["step4", 156],
  ["james", 1765],
  ["daniel", 610],
  ["results", 285],
  ["report", 300],
  ["share", 240],
  ["pdf", 125],
  ["outro", 160],
] as const;

export type SegKey = (typeof ORDER)[number][0];

export const SEG = (() => {
  let at = 0;
  const out = {} as Record<SegKey, { from: number; dur: number; to: number }>;
  for (const [k, d] of ORDER) {
    out[k] = { from: at, dur: d, to: at + d };
    at += d;
  }
  return out;
})();

export const TOTAL = SEG.outro.to;

/** Stages: continuous stretches of one browser window with one cursor. */
export const STAGE_A = { from: SEG.login.from, to: SEG.step4.to };
export const STAGE_B = { from: SEG.james.from, to: SEG.daniel.to };
export const STAGE_C = { from: SEG.results.from, to: SEG.pdf.to };

type NarrationId = keyof typeof manifest.narration;

export const NARRATION: { id: NarrationId; at: number }[] = [
  { id: "n01_intro", at: SEG.login.from + 8 },
  { id: "n02_dashboard", at: SEG.dashboard.from + 8 },
  { id: "n03_templates", at: SEG.templates.from + 8 },
  { id: "n04_candidate", at: SEG.step1.from + 6 },
  { id: "n05_references", at: SEG.step2.from + 6 },
  { id: "n06_template", at: SEG.step3.from + 4 },
  { id: "n07_launch", at: SEG.step4.from + 6 },
  { id: "n08_results", at: SEG.results.from + 8 },
  { id: "n09_report", at: SEG.report.from + 8 },
  { id: "n10_share", at: SEG.share.from + 6 },
  { id: "n11_pdf", at: SEG.pdf.from + 6 },
  { id: "n12_outro", at: SEG.outro.from + 8 },
];

/** Call timing inside stage B (frames relative to the stage start). */
export const CALLS = {
  james: {
    ringAt: 8,
    connectAt: 96,
    get hangupAt() {
      return this.connectAt + Math.round(manifest.calls.james.end * 30);
    },
  },
  daniel: {
    connectAt: SEG.daniel.from - SEG.james.from + 20,
    get hangupAt() {
      return this.connectAt + Math.round(manifest.calls.daniel.end * 30);
    },
  },
};
