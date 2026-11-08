import React from "react";
import { Composition } from "remotion";
import { VideoShort, TOTAL_FRAMES } from "./videos/lithium/VideoShort";

export const Root: React.FC = () => {
  return (
    <Composition
      id="LithiumShort"
      component={VideoShort}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
