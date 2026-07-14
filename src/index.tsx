import React from "react";
import { Composition, registerRoot } from "remotion";
import { LatheScene } from "./LatheScene";
import { WorldTripMap } from "./WorldTripMap";
import { AirRaidDemo } from "./asembly/AirRaidDemo";
import { MemoryVoiceDemo } from "./asembly/MemoryVoiceDemo";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LatheAnimation"
        component={LatheScene}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={600}
      />
      <Composition
        id="AirRaidDemo"
        component={AirRaidDemo}
        durationInFrames={570}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MemoryVoiceDemo"
        component={MemoryVoiceDemo}
        durationInFrames={585}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="WorldTripMap"
        component={WorldTripMap}
        durationInFrames={600}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};

registerRoot(RemotionRoot);
