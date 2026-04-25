import React from "react";
import { Composition } from "remotion";
import { HunterOSDemo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HunterOSDemo"
        component={HunterOSDemo}
        durationInFrames={840}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
