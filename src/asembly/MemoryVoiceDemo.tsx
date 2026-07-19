import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EndCard, FONT, PhoneFrame, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ 記憶中的聲音示範 v2（0B-3 職工的回憶）──30fps，總長 20s＝600f ═══
// 場景：PO 提供 OB-3 三連（scene1 亮景→scene2 訪客舉手機→scene3 暗景聚光）
// 開場靜音；v7 台灣年長男聲 8.36s，再播前輩口述節錄 5.2s。
const T = {
  s2aStart: 36,
  s2bStart: 58,
  phoneIn: 60,
  functionStart: 150,
  scanEnd: 150,
  progSwap: 470,
  memoryDuration: 156,
  fadeOut: 574,
  total: 600,
};
const VO = { invite: 150, memory: 410 };

const A = (p: string) => `asembly/memory/${p}`;
const SCENE_QR = { x: 118, y: 376, size: 26 };
const SCAN_QR = { x: 226, y: 584, size: 148 };
const SPOT3 = { x: "6.4%", y: "42.8%" };

const MemoryBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const s1Scale = interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.s2aStart, T.s2aStart + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s2Scale = interpolate(frame, [T.s2aStart, T.s2bStart + 10], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const in3 = interpolate(frame, [T.s2bStart, T.s2bStart + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push3 = interpolate(frame, [T.s2bStart, T.scanEnd + 20], [1.02, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgDim = interpolate(frame, [T.scanEnd - 10, T.scanEnd + 20], [0, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>
    {frame < T.s2aStart + 16 && <Img src={staticFile(A("scene1_0B3.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />}
    {frame >= T.s2aStart && frame < T.s2bStart + 14 && (
      <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${s2Scale})` }}>
        <Img src={staticFile(A("scene2_0B3.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    {frame >= T.s2bStart && (
      <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
        <Img src={staticFile(A("scene3_0B3_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />
  </>;
};

export const MemoryVoiceDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <MemoryBackground />

      {/* 段1 覆蓋層 */}
      <Sequence from={0} durationInFrames={T.functionStart}>
        <TitleCard index={3} title="記憶中的聲音" subtitle="掃描展板 QR，播放前輩口述與工作記憶" enterFrame={2} />
      </Sequence>
      <Sequence from={0} durationInFrames={T.s2aStart}>
        <SceneQrCallout src={A("qr_memory_0B3_labeled.png")} enterFrame={20} target={SCENE_QR}
          backgroundScale={interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12])}
          card={{ x: 200, y: 400, width: 320 }} />
      </Sequence>

      {/* 手機：掃描→記憶分頁（真實進度條 0:01→0:04）；不能包 Sequence */}
      {frame >= T.phoneIn - 5 && (
        <PhoneFrame enterFrame={T.phoneIn} x={380} hand={A("hand_hold.png")}>
          {frame < T.scanEnd && <ScanView bg={A("scan_panel.png")} from={T.phoneIn + 10} to={T.scanEnd} qr={SCAN_QR} doneLabel="✓ 已辨識・開啟記憶中的聲音" />}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A("app_memory_play1.png"))} style={{ position: "absolute", width: "100%", opacity: frame >= T.progSwap ? 0 : 1 }} />
              <Img src={staticFile(A("app_memory_play2.png"))} style={{ position: "absolute", width: "100%", opacity: interpolate(frame, [T.progSwap - 6, T.progSwap + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
            </>
          )}
        </PhoneFrame>
      )}

      {/* 功能段聲音：展項介紹 → 人才培育原始音檔節錄（真素材） */}
      <Sequence from={VO.invite}><Audio src={staticFile(A("vo_memory_invite_tw.mp3"))} /></Sequence>
      <Sequence from={VO.memory} durationInFrames={T.memoryDuration}><Audio src={staticFile(A("vo_s2_memory_excerpt.mp3"))} /></Sequence>

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "掃描展板，可聆聽前輩口述；從工作與生活片段，保存工場記憶。", from: VO.invite, to: VO.memory },
        { text: "1938 年，由臺北鐵道工技手新鄉重夫，", from: VO.memory, to: VO.memory + T.memoryDuration },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <EndCard feature="掃描展板 QR，播放前輩口述記憶" index={3} fade={fade} />
    </AbsoluteFill>
  );
};
