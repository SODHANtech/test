import React from "react";
import { Composition } from "remotion";
import { LithiumShort, LITHIUM_FRAMES } from "./videos/lithium/LithiumShort";

export const Root: React.FC = () => {
  return (
    <Composition
      id="LithiumShort"
      component={LithiumShort}
      durationInFrames={LITHIUM_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
