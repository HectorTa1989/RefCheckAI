/**
 * Stage A: sign in → dashboard → templates → new check (4 steps) → launch.
 * One browser window and one cursor; the page shown is chosen by frame.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ScreenStage, Key, HL, Typing, typed } from "./stage";
import { CheckPage, DashboardPage, LoginPage, NewCheckPage, RefDraft, TemplatesPage } from "./pages";
import { planScroll } from "./ui";
import { CANDIDATE, RECRUITER, REF_INPUTS, refPending } from "./data";
import { SEG } from "./timeline";

const L = SEG.login.from;
const D = SEG.dashboard.from;
const T = SEG.templates.from;
const S1 = SEG.step1.from;
const S2 = SEG.step2.from;
const S3 = SEG.step3.from;
const S4 = SEG.step4.from;
/** Frame the launch lands on the check page. */
const NAV_CHECK = S4 + 66;

const ramp = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
const enterAt = (f: number, at: number) => ramp(f, at, at + 9);
const blink = (f: number) => Math.floor(f / 15) % 2 === 0;

/* ─────────── typing schedule ─────────── */

const EMAIL: Typing = { from: L + 50, text: RECRUITER.email, cps: 16 };
const CAND: Record<"name" | "role" | "company", Typing> = {
  name: { from: S1 + 32, text: CANDIDATE.name, cps: 20 },
  role: { from: S1 + 76, text: CANDIDATE.role, cps: 26 },
  company: { from: S1 + 130, text: CANDIDATE.company, cps: 20 },
};
const JD_PASTE = S1 + 172;

type F = "name" | "phone" | "rel" | "co";
const FIELDS: F[] = ["name", "phone", "rel", "co"];
/** [reference, field, start frame, cps] — Tab moves between fields. */
const REF_TYPING: [number, F, number, number][] = [
  [0, "name", S2 + 28, 32],
  [0, "phone", S2 + 44, 32],
  [0, "rel", S2 + 60, 32],
  [0, "co", S2 + 84, 32],
  [1, "name", S2 + 124, 48],
  [1, "phone", S2 + 135, 48],
  [1, "rel", S2 + 147, 48],
  [1, "co", S2 + 165, 48],
  [2, "name", S2 + 250, 48],
  [2, "phone", S2 + 262, 48],
  [2, "rel", S2 + 274, 48],
  [2, "co", S2 + 290, 48],
];
const refText = (i: number, f: F) => REF_INPUTS[i][f];
const REF_SPECS: Typing[] = REF_TYPING.map(([i, f, from, cps]) => ({ from, text: refText(i, f), cps }));

const TYPING: Typing[] = [EMAIL, ...Object.values(CAND), ...REF_SPECS];

/* ─────────── cursor ─────────── */

const KEYS: Key[] = [
  { at: L, x: 880, y: 610, travel: 0 },
  { at: L + 22, t: "login-email", dx: -110, click: true },
  { at: L + 88, t: "login-continue", click: true },

  { at: D + 22, t: "tab-in_progress", click: true },
  { at: D + 96, t: "tab-all", click: true },
  { at: D + 158, t: "nav-templates", click: true },

  { at: T + 16, t: "tpl-swe", dx: -60, click: true },
  { at: T + 242, t: "nav-new", click: true },

  { at: S1 + 8, t: "c-name", dx: -80, click: true },
  { at: S1 + 52, t: "c-role", dx: -150, click: true },
  { at: S1 + 106, t: "c-company", dx: -150, click: true },
  { at: S1 + 144, t: "c-jd", dx: -150, dy: -18, click: true },
  { at: S1 + 176, t: "continue", click: true },

  { at: S2 + 4, t: "ref0-name", dx: -70, click: true },
  { at: S2 + 100, t: "ref1-name", dx: -70, click: true },
  { at: S2 + 176, t: "add-ref", click: true },
  { at: S2 + 226, t: "ref2-name", dx: -70, click: true },
  { at: S2 + 300, t: "continue", click: true },

  { at: S3 + 4, t: "pick-swe", dx: -120, click: true },
  { at: S3 + 50, t: "continue", click: true },

  { at: S4 + 22, t: "launch", click: true },
  { at: S4 + 72, x: 1010, y: 540, travel: 26 },
];

/* ─────────── highlights (state changes caused by a click) ─────────── */

const HLS: HL[] = [
  { t: "login-card", at: L + 140, tone: "green", hold: 80 },
  { t: "dash-list", at: D + 46, tone: "blue", hold: 40 },
  { t: "tpl-swe", at: T + 40, tone: "blue", hold: 64 },
  { t: "stepbar", at: S2 + 2, tone: "green", hold: 34, pad: 8 },
  { t: "ref-card-2", at: S2 + 200, tone: "green", hold: 44 },
  { t: "stepbar", at: S3 + 2, tone: "green", hold: 26, pad: 8 },
  { t: "pick-swe", at: S3 + 28, tone: "blue", hold: 34 },
  { t: "stepbar", at: S4 + 2, tone: "green", hold: 26, pad: 8 },
  { t: "launch", at: S4 + 46, tone: "amber", hold: 16, radius: 999 },
  { t: "chip-james", at: S4 + 88, tone: "amber", hold: 44, radius: 999, pad: 4 },
  { t: "chip-priya", at: S4 + 92, tone: "amber", hold: 42, radius: 999, pad: 4 },
  { t: "chip-daniel", at: S4 + 96, tone: "amber", hold: 40, radius: 999, pad: 4 },
];

/* ─────────── page state ─────────── */

function wizardFocus(f: number): string | null {
  if (f < S2) {
    if (f >= S1 + 166) return "jd";
    if (f >= S1 + 128) return "company";
    if (f >= S1 + 74) return "role";
    if (f >= S1 + 30) return "name";
    return null;
  }
  if (f >= S2 + 322 || (f >= S2 + 198 && f < S2 + 248)) return null;
  const started = REF_TYPING.filter(([, , from]) => f >= from - 2);
  if (!started.length) return f >= S2 + 26 ? "ref0-name" : null;
  const [i, field] = started[started.length - 1];
  return `ref${i}-${field}`;
}

function refDrafts(f: number): RefDraft[] {
  const drafts: RefDraft[] = [0, 1, 2].map(() => ({ name: "", phone: "", rel: "", co: "" }));
  REF_TYPING.forEach(([i, field], k) => {
    drafts[i][field] = typed(f, REF_SPECS[k]);
  });
  return f >= S2 + 198 ? drafts : drafts.slice(0, 2);
}

const UI: React.FC = () => {
  const f = useCurrentFrame();

  if (f < D) {
    return (
      <LoginPage
        email={typed(f, EMAIL)}
        focused={f >= L + 44 && f < L + 110}
        caret={(f >= EMAIL.from && f < EMAIL.from + 40) || blink(f)}
        sending={f >= L + 110 && f < L + 138}
        sent={f >= L + 138}
        hover={f >= L + 104 && f < L + 110}
        frame={f}
        enter={enterAt(f, L)}
      />
    );
  }

  if (f < T) {
    const filter = f >= D + 44 && f < D + 118 ? "in_progress" : "all";
    return <DashboardPage filter={filter} enter={enterAt(f, D)} />;
  }

  if (f < S1) {
    return (
      <TemplatesPage
        expanded={f >= T + 38 ? "swe" : null}
        open={ramp(f, T + 38, T + 50)}
        enter={enterAt(f, T)}
        scrollFn={planScroll(f, [{ at: T + 84, dur: 40, to: (y) => y("tpl-swe") - 110 }])}
      />
    );
  }

  if (f < NAV_CHECK) {
    const step = f < S2 ? 0 : f < S3 ? 1 : f < S4 ? 2 : 3;
    const cand = {
      name: typed(f, CAND.name),
      role: typed(f, CAND.role),
      company: typed(f, CAND.company),
      jd: f >= JD_PASTE ? CANDIDATE.jd : "",
    };
    const typingNow = TYPING.some((s) => f >= s.from && f < s.from + Math.ceil((s.text.length * 30) / (s.cps ?? 16)) + 6);
    const scrollFn =
      step === 0
        ? planScroll(f, [{ at: S1 + 138, dur: 18, to: (_y, max) => max }])
        : step === 1
        ? planScroll(f, [
            { at: S2 + 100, dur: 20, to: (y) => y("add-ref") - 40 },
            { at: S2 + 204, dur: 28, to: (_y, max) => max },
          ])
        : step === 2
          ? () => 60
          : step === 3
            ? planScroll(f, [
                { at: S4, dur: 1, to: () => 60 },
                { at: S4 + 8, dur: 18, to: (_y, max) => max },
              ])
            : undefined;
    const continueEnabled = step === 0 ? f >= CAND.company.from + 12 : step === 1 ? f >= S2 + 300 : true;
    return (
      <NewCheckPage
        s={{
          step,
          enter: step === 0 ? enterAt(f, S1) : 1,
          scrollFn,
          cand,
          focus: wizardFocus(f),
          caret: typingNow || blink(f),
          refs: refDrafts(f),
          thirdIn: ramp(f, S2 + 198, S2 + 212),
          template: f >= S3 + 26 ? "swe" : "standard",
          continueHover:
            (f >= S1 + 194 && f < S2) || (f >= S2 + 318 && f < S3) || (f >= S3 + 68 && f < S4),
          continueEnabled,
          launching: f >= S4 + 44,
          frame: f,
        }}
      />
    );
  }

  // Launched: the check page, with every reference being dialled at once.
  const status = (at: number) => (f >= at ? "calling" : "queued");
  const refs = refPending("queued").map((r, i) => ({ ...r, call_status: status(S4 + 86 + i * 4) as "calling" | "queued" }));
  const toastT = ramp(f, NAV_CHECK + 2, NAV_CHECK + 10) * (1 - ramp(f, S4 + 140, S4 + 150));
  return (
    <CheckPage
      s={{
        complete: false,
        refs,
        ring: 0,
        enter: enterAt(f, NAV_CHECK),
        expanded: { james: true },
        toast: { text: "Reference checks launched! We'll email you when complete.", t: toastT },
        frame: f,
      }}
    />
  );
};

const urlAt = (f: number) =>
  f < D
    ? "refcheck.ai/login"
    : f < T
      ? "refcheck.ai/dashboard"
      : f < S1
        ? "refcheck.ai/templates"
        : f < NAV_CHECK
          ? "refcheck.ai/checks/new"
          : "refcheck.ai/checks/3f8c2a91";

const loadingAt = (f: number) => {
  for (const at of [D, T, S1, NAV_CHECK]) {
    if (f >= at - 8 && f < at + 6) return (f - (at - 8)) / 14;
  }
  return 0;
};

export const StageA: React.FC = () => (
  <ScreenStage url={urlAt} UI={UI} keys={KEYS} hls={HLS} typing={TYPING} loading={loadingAt} />
);
