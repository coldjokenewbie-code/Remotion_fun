import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EndCard, FONT, PhoneFrame, ScanView, Subtitle, TitleCard } from "./shared";

// ═══ 記憶中的聲音示範 v2（0B-3 職工的回憶）──30fps，總長 20s＝600f ═══
// 場景：PO 提供 OB-3 三連（scene1 亮景→scene2 訪客舉手機→scene3 暗景聚光）
// 開場靜音；內斂專業職工版 7.49s(225f)，再播前輩口述節錄 5.2s(156f)
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
const VO = { invite: 150, memory: 375 };

const A = (p: string) => `asembly/memory/${p}`;
const QR1 = { x: 130, y: 381 };          // scene1 立牌 QR 畫布基準（抽幀校核）
const SPOT3 = { x: "6.4%", y: "42.8%" };

const QrCallout: React.FC<{ enterFrame: number; bgScaleOf: (f: number) => number }> = ({ enterFrame, bgScaleOf }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [enterFrame, enterFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = bgScaleOf(frame);
  const ax = 960 + (QR1.x - 960) * s;
  const ay = 540 + (QR1.y - 540) * s;
  const card = { x: 200, y: 400, w: 320 };
  const lineFrom = { x: card.x - 6, y: card.y + card.w * 0.4 };
  return (
    <>
      <div style={{
        position: "absolute", left: card.x, top: card.y, width: card.w,
        transform: `translateX(${interpolate(p, [0, 1], [-80, 0])}px)`, opacity: p,
        background: "#fff", borderRadius: 14, padding: 10,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      }}>
        <Img src={staticFile(A("qr_memory_0B3_labeled.png"))} style={{ width: "100%", display: "block" }} />
      </div>
      <svg style={{ position: "absolute", inset: 0, opacity: p }} width={1920} height={1080}>
        <line x1={lineFrom.x} y1={lineFrom.y} x2={ax + 30} y2={ay + 6} stroke="#fff" strokeWidth={3.5} strokeDasharray="10 7" />
        <circle cx={ax} cy={ay} r={30} fill="none" stroke="#fff" strokeWidth={4} />
      </svg>
    </>
  );
};

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
        <QrCallout enterFrame={24} bgScaleOf={(f) => interpolate(f, [0, T.s2aStart + 18], [1.05, 1.12])} />
      </Sequence>

      {/* 手機：掃描→記憶分頁（真實進度條 0:01→0:04）；不能包 Sequence */}
      {frame >= T.phoneIn - 5 && (
        <PhoneFrame enterFrame={T.phoneIn} x={380} hand={A("hand_hold.png")}>
          {frame < T.scanEnd && <ScanView bg={A("scan_panel.png")} from={T.phoneIn + 10} to={T.scanEnd} doneLabel="✓ 已辨識・開啟記憶中的聲音" />}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A("app_memory_play1.png"))} style={{ position: "absolute", width: "100%", opacity: frame >= T.progSwap ? 0 : 1 }} />
              <Img src={staticFile(A("app_memory_play2.png"))} style={{ position: "absolute", width: "100%", opacity: interpolate(frame, [T.progSwap - 6, T.progSwap + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
            </>
          )}
        </PhoneFrame>
      )}

      {/* 功能段聲音：微台版邀請旁白 → 人才培育原始音檔節錄（真素材） */}
      <Sequence from={VO.invite}><Audio src={staticFile(A("vo_memory_invite_tw.mp3"))} /></Sequence>
      <Sequence from={VO.memory} durationInFrames={T.memoryDuration}><Audio src={staticFile(A("vo_s2_memory_excerpt.mp3"))} /></Sequence>

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "不妨掃描展板 QR Code，聽聽前輩口述，保存工場記憶。", from: VO.invite, to: VO.memory },
        { text: "1938 年，由臺北鐵道工技手新鄉重夫，", from: VO.memory, to: VO.memory + T.memoryDuration },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <EndCard feature="掃描展板 QR，播放前輩口述記憶" index={3} fade={fade} />
    </AbsoluteFill>
  );
};
