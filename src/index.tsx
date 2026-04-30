import React from "react";
import { Composition, registerRoot } from "remotion";
import { LatheScene } from "./LatheScene";

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LatheAnimation"
      component={LatheScene}
      durationInFrames={150}
      fps={30}
      width={1280}
      height={600}
    />
  );
};

registerRoot(RemotionRoot);
