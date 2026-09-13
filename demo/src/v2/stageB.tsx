/**
 * Stage B: the calls. The check page stays live on the left while CALL-E
 * rings James (full call, with the middle fast-forwarded) and then Daniel
 * (the "we only confirm dates" policy moment).
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Loop, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ScreenStage, HL, Place } from "./stage";
import { CheckPage } from "./pages";
import { CallPanel, CallSpec } from "./CallPanel";
import { REFS, refPending } from "./data";
import { CALLS, SEG, STAGE_B } from "./timeline";
import manifest from "./audio-manifest.json";
import type { RefData } from "./ui";

const DN = SEG.daniel.from - STAGE_B.from; // Daniel segment start, stage-relative
const J = CALLS.james;
const DC = CALLS.daniel;

const ease = Easing.bezier(0.33, 0, 0.2, 1);
const ramp = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** Window shrinks left to make room for the call panel. */
export const CALL_PLACE: Required<Pick<Place, "scale" | "x">> = { scale: 0.74, x: -298 };
const placeAt = (f: number): Place => {
  const k = ramp(f, 0, 24);
  return { scale: 1 + (CALL_PLACE.scale - 1) * k, x: CALL_PLACE.x * k };
};

const JAMES_DONE = J.hangupAt + 6;
const DANIEL_DONE = DC.hangupAt + 6;

const UI: React.FC = () => {
  const f = useCurrentFrame();
  const done = (key: string) => (key === "james" ? f >= JAMES_DONE : key === "daniel" ? f >= DANIEL_DONE : false);
  const refs: RefData[] = refPending("calling").map((r, i) => (done(r.key) ? REFS[i] : r));
  return (
    <CheckPage
      s={{ complete: false, refs, ring: 0, expanded: { james: true }, frame: f + STAGE_B.from }}
    />
  );
};

const HLS: HL[] = [
  { t: "chip-james", at: JAMES_DONE + 2, tone: "green", hold: 60, radius: 999, pad: 4 },
  { t: "rp-james-status", at: JAMES_DONE + 2, tone: "green", hold: 60, radius: 10, pad: 6 },
  { t: "chip-daniel", at: DANIEL_DONE + 2, tone: "green", hold: 40, radius: 999, pad: 4 },
];

/* ─────────── call specs ─────────── */

const jamesLines = manifest.calls.james.lines;
const at = (id: string) => jamesLines.find((l) => l.id === id)!;
const endOf = (id: string) => at(id).start + at(id).duration;
const skipLine = jamesLines.find((l) => (l as { skip?: boolean }).skip)!;
const skipPrev = jamesLines[jamesLines.indexOf(skipLine) - 1];
const skipFrom = skipPrev.start + skipPrev.duration + 0.15;
const skipTo = skipLine.start - 0.1;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const JAMES: CallSpec = {
  key: "james",
  name: "James Okafor",
  initials: "JO",
  relationship: "Former direct manager · Tidewater Payments",
  phone: "+1 (415) •••-0142",
  refIndex: 1,
  callId: "call_8f2c61d0b3a9",
  connectAt: J.connectAt,
  ringFrom: J.ringAt,
  clockOffset: 0,
  // James's call ran 8:47 end to end.
  skipSeconds: 527 - manifest.calls.james.end,
  dots: [
    [at("j05").start, 1, "active"],
    [endOf("j08"), 1, "done"],
    [lerp(skipFrom, skipTo, 0.1), 0, "done"],
    [lerp(skipFrom, skipTo, 0.25), 2, "done"],
    [lerp(skipFrom, skipTo, 0.4), 3, "done"],
    [lerp(skipFrom, skipTo, 0.55), 4, "done"],
    [lerp(skipFrom, skipTo, 0.7), 5, "done"],
    [lerp(skipFrom, skipTo, 0.82), 6, "done"],
    [lerp(skipFrom, skipTo, 0.94), 8, "done"],
    [skipLine.start, 7, "active"],
    [endOf("j10"), 7, "done"],
  ],
};

const danielLines = manifest.calls.daniel.lines;
const dEnd = (id: string) => {
  const l = danielLines.find((x) => x.id === id)!;
  return l.start + l.duration;
};

const DANIEL: CallSpec = {
  key: "daniel",
  name: "Daniel Weiss",
  initials: "DW",
  relationship: "Skip-level manager · Harbor Commerce",
  phone: "+1 (312) •••-0107",
  refIndex: 3,
  callId: "call_2d7e94a1f06c",
  connectAt: DC.connectAt,
  clockOffset: 41,
  initialDots: ["done", "pending", "pending", "pending", "pending", "pending", "pending", "pending", "pending"],
  dots: [
    ...[1, 2, 3, 4, 5, 6, 8].map((i, n) => [dEnd("d00") + n * 0.08, i, "none"] as [number, number, "none"]),
    [dEnd("d02"), 7, "done"],
  ],
};

/* ─────────── audio ─────────── */

const Sfx: React.FC<{ name: keyof typeof manifest.sfx; from: number; volume?: number; frames?: number }> = ({
  name,
  from,
  volume = 1,
  frames,
}) => (
  <Sequence from={from} durationInFrames={frames ?? Math.ceil(manifest.sfx[name].duration * 30) + 2} layout="none">
    <Audio src={staticFile(manifest.sfx[name].file)} volume={volume} />
  </Sequence>
);

const CallAudio: React.FC<{ spec: CallSpec }> = ({ spec }) => {
  const call = manifest.calls[spec.key];
  const hangup = spec.connectAt + Math.round(call.end * 30);
  const lineHiss = hangup - spec.connectAt;
  return (
    <>
      {spec.ringFrom != null && (
        <>
          <Sfx name="ringback" from={spec.ringFrom} volume={0.55} />
          <Sfx name="pickup" from={spec.connectAt - 3} volume={0.8} />
        </>
      )}
      <Sequence from={spec.connectAt} durationInFrames={lineHiss} layout="none">
        <Loop durationInFrames={Math.round(manifest.sfx.line.duration * 30)}>
          <Audio src={staticFile(manifest.sfx.line.file)} volume={0.9} />
        </Loop>
      </Sequence>
      {call.lines.map((l) => (
        <Sequence
          key={l.id}
          from={spec.connectAt + Math.round(l.start * 30)}
          durationInFrames={Math.ceil(l.duration * 30) + 4}
          layout="none"
        >
          <Audio src={staticFile(l.file)} volume={l.who === "bot" ? 0.95 : 1} />
        </Sequence>
      ))}
      {spec.key === "james" && <Sfx name="skip" from={spec.connectAt + Math.round(skipFrom * 30)} volume={0.5} />}
      <Sfx name="hangup" from={hangup - 2} volume={0.7} />
    </>
  );
};

export const StageB: React.FC = () => {
  const f = useCurrentFrame();
  // James's panel in, then swapped for Daniel's.
  const jamesIn = ramp(f, 6, 28) * (1 - ramp(f, DN, DN + 12));
  const danielIn = ramp(f, DN + 8, DN + 26);
  return (
    <AbsoluteFill>
      <ScreenStage
        url="refcheck.ai/checks/3f8c2a91"
        UI={UI}
        hls={HLS}
        hideCursor={() => true}
        place={placeAt}
      />
      {f < DN + 14 && <CallPanel spec={JAMES} left={1300} top={155} opacity={jamesIn} slide={jamesIn} />}
      {f >= DN + 6 && <CallPanel spec={DANIEL} left={1300} top={155} opacity={danielIn} slide={danielIn} />}
      <CallAudio spec={JAMES} />
      <CallAudio spec={DANIEL} />
    </AbsoluteFill>
  );
};
