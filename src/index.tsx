import React from "react";
import { Composition, registerRoot } from "remotion";
import { WorldTripMap } from "./WorldTripMap";
import { AirRaidDemo, airRaidDefaultProps, airRaidSchema } from "./asembly/AirRaidDemo";
import { ARDemo, arDemoDefaultProps, arDemoSchema } from "./asembly/ARDemo";
import { MemoryVoiceDemo, memoryVoiceDefaultProps, memoryVoiceSchema } from "./asembly/MemoryVoiceDemo";
import { QuestDemo, questDemoDefaultProps, questDemoSchema } from "./asembly/QuestDemo";

// 四支示範片：時間軸/文案由 props 控制（Studio 右欄可調），總長隨「總長」欄位連動
const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AirRaidDemo"
        component={AirRaidDemo}
        durationInFrames={732}
        fps={30}
        width={1920}
        height={1080}
        schema={airRaidSchema}
        defaultProps={airRaidDefaultProps}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
      />
      <Composition
        id="ARDemo"
        component={ARDemo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        schema={arDemoSchema}
        defaultProps={arDemoDefaultProps}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
      />
      <Composition
        id="MemoryVoiceDemo"
        component={MemoryVoiceDemo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
        schema={memoryVoiceSchema}
        defaultProps={memoryVoiceDefaultProps}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
      />
      <Composition
        id="QuestDemo"
        component={QuestDemo}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
        schema={questDemoSchema}
        defaultProps={questDemoDefaultProps}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
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
