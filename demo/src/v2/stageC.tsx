/**
 * Stage C: results land → the report → share link → public view → PDF.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ScreenStage, Key, HL, Place } from "./stage";
import { CheckPage, PdfViewer, SharedPage } from "./pages";
import { planScroll } from "./ui";
import { REFS, SHARE_URL, refPending } from "./data";
import { SEG, STAGE_C } from "./timeline";
import { CALL_PLACE } from "./stageB";
import { EmailBanner } from "./Notification";
import manifest from "./audio-manifest.json";
import type { RefData } from "./ui";

const R = SEG.results.from - STAGE_C.from; // 0
const P = SEG.report.from - STAGE_C.from;
const SH = SEG.share.from - STAGE_C.from;
const PD = SEG.pdf.from - STAGE_C.from;

const SHARED_AT = SH + 106; // shared page replaces the report
const PDF_AT = PD + 34; // PDF viewer opens

const ease = Easing.bezier(0.33, 0, 0.2, 1);
const ramp = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** The real ScoreRing fills over 1 s with a slight overshoot. */
const ringFill = (f: number, at: number) =>
  interpolate(f, [at, at + 20, at + 30], [0, 1.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.2, 0.64, 1),
  });

const placeAt = (f: number): Place => {
  const k = ramp(f, R, R + 24);
  return { scale: CALL_PLACE.scale + (1 - CALL_PLACE.scale) * k, x: CALL_PLACE.x * (1 - k) };
};

const COMPLETE_AT = R + 48;

const KEYS: Key[] = [
  { at: R + 30, x: 980, y: 560, travel: 0 },
  { at: P + 100, t: "rp-james-transcript-btn", dx: -40, click: true },
  { at: P + 200, t: "rp-priya-head", dx: -120, click: true },
  { at: SH + 8, t: "share", click: true },
  { at: SH + 64, x: 560, y: -20, click: true },
  { at: SH + 104, x: 900, y: 380, travel: 24 },
  { at: PD + 4, t: "shared-pdf", click: true },
  { at: PD + 44, x: 1150, y: 640, travel: 26 },
];

const HLS: HL[] = [
  { t: "chip-priya", at: R + 32, tone: "green", hold: 34, radius: 999, pad: 4 },
  { t: "banner", at: COMPLETE_AT + 2, tone: "green", hold: 48 },
  { t: "ring", at: COMPLETE_AT + 12, tone: "green", hold: 54, radius: 999, pad: 8 },
  { t: "rec", at: COMPLETE_AT + 18, tone: "green", hold: 48, radius: 999, pad: 5 },
  { t: "stats", at: COMPLETE_AT + 34, tone: "green", hold: 44, pad: 10 },
  { t: "actions", at: COMPLETE_AT + 48, tone: "blue", hold: 44, radius: 999, pad: 6 },
  { t: "rp-james-transcript", at: P + 124, tone: "blue", hold: 50 },
  { t: "rp-priya-flags", at: P + 244, tone: "red", hold: 44 },
  { t: "share", at: SH + 32, tone: "blue", hold: 40, radius: 999 },
  { t: "shared-badge", at: SHARED_AT + 14, tone: "blue", hold: 40, radius: 999, pad: 5 },
  { t: "shared-privacy", at: SH + 196, tone: "green", hold: 40, pad: 8 },
  { t: "pdf-page", at: PDF_AT + 16, tone: "green", hold: 58, pad: 6, radius: 8 },
];

const reportScroll = (f: number) =>
  planScroll(f, [
    { at: P + 4, dur: 36, to: (y) => y("rp-james-card") - 24 },
    { at: P + 70, dur: 48, to: (y) => y("rp-james-transcript-btn") - 560 },
    { at: P + 130, dur: 30, to: (y) => y("rp-james-transcript-btn") - 270 },
    { at: P + 184, dur: 26, to: (y) => y("rp-priya-card") - 170 },
    { at: P + 236, dur: 30, to: (y) => y("rp-priya-card") - 90 },
    { at: SH, dur: 22, to: () => 0 },
  ]);

const UI: React.FC = () => {
  const f = useCurrentFrame();

  if (f >= PDF_AT) return <PdfViewer refs={REFS} t={ramp(f, PDF_AT, PDF_AT + 12)} />;

  if (f >= SHARED_AT) {
    return (
      <SharedPage
        refs={REFS}
        enter={ramp(f, SHARED_AT, SHARED_AT + 9)}
        pdfHover={f >= PD + 22 && f < PD + 30}
        scrollFn={planScroll(f, [{ at: SH + 150, dur: 40, to: (_y, max) => max }])}
      />
    );
  }

  const refs: RefData[] = REFS.map((r) => (r.key === "priya" && f < R + 30 ? refPending("calling")[1] : r));
  const toastT = ramp(f, SH + 32, SH + 40) * (1 - ramp(f, SH + 100, SH + 110));
  return (
    <CheckPage
      s={{
        complete: f >= COMPLETE_AT,
        refs,
        ring: ringFill(f, COMPLETE_AT + 6),
        expanded: { james: true, priya: f >= P + 222 },
        open: { james: 1, priya: ramp(f, P + 222, P + 234) },
        transcript: f >= P + 122,
        shared: f >= SH + 30,
        toast: toastT > 0 ? { text: "Share link copied to clipboard!", t: toastT } : null,
        scrollFn: reportScroll(f),
        shareHover: f >= SH + 26 && f < SH + 34,
        frame: f,
      }}
    />
  );
};

const urlAt = (f: number) =>
  f >= PDF_AT
    ? "api.refcheck.ai/api/shared/7f3c9a2e…/pdf"
    : f >= SH + 94
      ? SHARE_URL
      : "refcheck.ai/checks/3f8c2a91";

const loadingAt = (f: number) => {
  for (const at of [SHARED_AT, PDF_AT]) {
    if (f >= at - 8 && f < at + 6) return (f - (at - 8)) / 14;
  }
  return 0;
};

export const StageC: React.FC = () => {
  const f = useCurrentFrame();
  const banner = ramp(f, R + 150, R + 164) * (1 - ramp(f, R + 250, R + 264));
  return (
    <AbsoluteFill>
      <ScreenStage
        url={urlAt}
        UI={UI}
        keys={KEYS}
        hls={HLS}
        place={placeAt}
        loading={loadingAt}
        urlSelected={(x) => x >= SH + 86 && x < SH + 94}
        hideCursor={(x) => x < R + 30}
      />
      <EmailBanner t={banner} />
      <Sequence from={R + 150} durationInFrames={30} layout="none">
        <Audio src={staticFile(manifest.sfx.chime.file)} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};
