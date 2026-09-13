import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Hook } from "./scenes/Hook";
import { Dashboard } from "./scenes/Dashboard";
import {
  WizardCandidate,
  WizardReferences,
  WizardTemplate,
  WizardLaunch,
} from "./scenes/Wizard";
import { CalleCall } from "./scenes/CalleCall";
import { Progress, Report, Export } from "./scenes/Report";
import { Outro } from "./scenes/Outro";
import { Caption } from "./ui/Stage";

/** Narration starts this many frames into each scene, so the cut breathes. */
const VO_LEAD = 10;

type SceneDef = {
  key: string;
  Comp: React.FC;
  duration: number;
  vo: string;
  caption?: { title: string; sub?: string };
};

export const SCENES: SceneDef[] = [
  { key: "hook", Comp: Hook, duration: 600, vo: "01_hook" },
  {
    key: "dashboard",
    Comp: Dashboard,
    duration: 330,
    vo: "02_dashboard",
  },
  {
    key: "candidate",
    Comp: WizardCandidate,
    duration: 465,
    vo: "03_candidate",
  },
  {
    key: "references",
    Comp: WizardReferences,
    duration: 405,
    vo: "04_references",
  },
  {
    key: "template",
    Comp: WizardTemplate,
    duration: 345,
    vo: "05_template",
  },
  {
    key: "launch",
    Comp: WizardLaunch,
    duration: 180,
    vo: "06_launch",
  },
  {
    key: "calle",
    Comp: CalleCall,
    duration: 970,
    vo: "07_calle",
  },
  {
    key: "progress",
    Comp: Progress,
    duration: 150,
    vo: "08_progress",
  },
  {
    key: "report",
    Comp: Report,
    duration: 630,
    vo: "09_report",
  },
  { key: "export", Comp: Export, duration: 180, vo: "10_export" },
  { key: "outro", Comp: Outro, duration: 390, vo: "11_outro" },
];

export const TOTAL = SCENES.reduce((n, s) => n + s.duration, 0);

/** Chapter label / caption overlay, fading in and out inside its scene. */
const Overlay: React.FC<{ s: SceneDef }> = ({ s }) => {
  const frame = useCurrentFrame();
  const o = interpolate(
    frame,
    [14, 36, s.duration - 30, s.duration - 12],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  if (s.caption)
    return <Caption title={s.caption.title} sub={s.caption.sub} opacity={o} />;
  return null;
};

export const RefCheckDemo: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: "#E4E7EE" }}>
      {SCENES.map((s) => {
        const from = at;
        at += s.duration;
        return (
          <React.Fragment key={s.key}>
            <Sequence from={from} durationInFrames={s.duration} name={s.key}>
              <s.Comp />
              <Overlay s={s} />
            </Sequence>
            <Sequence
              from={from + VO_LEAD}
              durationInFrames={s.duration - VO_LEAD}
              name={`vo:${s.key}`}
            >
              <Audio src={staticFile(`vo/${s.vo}.mp3`)} volume={1} />
            </Sequence>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
