import React from "react";
import { Composition, registerRoot } from "remotion";
import { WorldTripMap } from "./WorldTripMap";
import { AirRaidDemo } from "./asembly/AirRaidDemo";
import { ARDemo } from "./asembly/ARDemo";
import { MemoryVoiceDemo } from "./asembly/MemoryVoiceDemo";
import { QuestDemo } from "./asembly/QuestDemo";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AirRaidDemo"
        component={AirRaidDemo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ARDemo"
        component={ARDemo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MemoryVoiceDemo"
        component={MemoryVoiceDemo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="QuestDemo"
        component={QuestDemo}
        durationInFrames={480}
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
