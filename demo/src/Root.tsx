import React from "react";
import { Composition } from "remotion";
import { RefCheckDemo, TOTAL } from "./RefCheckDemo";
import { Walkthrough, TOTAL as WALKTHROUGH_TOTAL } from "./v2/Walkthrough";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="RefCheckDemo"
      component={RefCheckDemo}
      durationInFrames={TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="RefCheckWalkthrough"
      component={Walkthrough}
      durationInFrames={WALKTHROUGH_TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
