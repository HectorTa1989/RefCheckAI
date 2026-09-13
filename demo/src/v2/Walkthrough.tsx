/**
 * RefCheck AI walkthrough, v2 — every button clicked on screen, the reference
 * call heard end to end, state changes outlined, no captions.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile } from "remotion";
import manifest from "./audio-manifest.json";
import { loadInter } from "./fonts";
import { Backdrop } from "./stage";
import { StageA } from "./stageA";
import { StageB } from "./stageB";
import { StageC } from "./stageC";
import { Outro } from "./Outro";
import { NARRATION, SEG, STAGE_A, STAGE_B, STAGE_C, TOTAL } from "./timeline";

export { TOTAL };

/** Hold the first frame until Inter is ready (registered at mount; see fonts.ts). */
const useInter = () => {
  const [handle] = React.useState(() => delayRender("Loading Inter"));
  React.useEffect(() => {
    loadInter().finally(() => continueRender(handle));
  }, [handle]);
};

export const Walkthrough: React.FC = () => {
  useInter();
  return (
  <AbsoluteFill style={{ background: "#E4E7EE" }}>
    <Backdrop />
    <Sequence from={STAGE_A.from} durationInFrames={STAGE_A.to - STAGE_A.from} name="A · sign in → launch">
      <StageA />
    </Sequence>
    <Sequence from={STAGE_B.from} durationInFrames={STAGE_B.to - STAGE_B.from} name="B · calls">
      <StageB />
    </Sequence>
    <Sequence from={STAGE_C.from} durationInFrames={STAGE_C.to - STAGE_C.from} name="C · report → share → PDF">
      <StageC />
    </Sequence>
    <Sequence from={SEG.outro.from} durationInFrames={SEG.outro.dur} name="outro">
      <Outro dur={SEG.outro.dur} />
    </Sequence>

    {NARRATION.map(({ id, at }) => {
      const clip = manifest.narration[id];
      return (
        <Sequence key={id} from={at} durationInFrames={Math.ceil(clip.duration * 30) + 4} name={`vo:${id}`}>
          <Audio src={staticFile(clip.file)} volume={1} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
  );
};
