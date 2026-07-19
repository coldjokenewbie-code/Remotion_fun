import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EndCard, FONT, PhoneFrame, ScanView, Subtitle, TitleCard } from "./shared";

// ═══ 時間軸常數（30fps，總長 20s＝600f；開場依序呈現標示卡、QR 示意、掃描）════
// 空間圖 v3（PO 提供 0B-7 展台渲染三連）：scene1 亮景全景 → scene2 暗景中景（QR 聚光）→ scene3 近景正視
// 開場靜音；內斂專業職工版 guide=13.25s(398f)
const T = {
  s2aStart: 36,
  s2bStart: 58,
  phoneIn: 64,
  functionStart: 160,
  scanEnd: 160,
  fadeOut: 574,
  total: 600,
};
const VO = { guide: 160 };

const A = (p: string) => `asembly/airraid/${p}`;
// 聚光點（PIL 亮度質心量測，objectFit cover 換算後畫布座標）
const SPOT2 = { x: "19.7%", y: "69.5%" }; // PO 2026-07-17 更新版 scene2（2047×1066）重量測
const SPOT3 = { x: "12.5%", y: "56%" };
// scene1 說明牌上 QR 的畫布座標（cover 換算，scale=1 基準；隨 wideScale 以畫面中心縮放）
const QR1 = { x: 656, y: 809 };

// ── 段1 左側 QR 放大示意：說明牌上的 QR 放大於左側＋指線＋現場圈點 ──
const QrCallout: React.FC<{ enterFrame: number; bgScaleOf: (f: number) => number }> = ({ enterFrame, bgScaleOf }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [enterFrame, enterFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = bgScaleOf(frame);
  const ax = 960 + (QR1.x - 960) * s;
  const ay = 540 + (QR1.y - 540) * s;
  const card = { x: 140, y: 400, w: 320 };
  const lineFrom = { x: card.x + card.w + 6, y: card.y + card.w * 0.55 };
  return (
    <>
      <div style={{
        position: "absolute", left: card.x, top: card.y, width: card.w,
        transform: `translateX(${interpolate(p, [0, 1], [-80, 0])}px)`, opacity: p,
        background: "#fff", borderRadius: 14, padding: 10,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      }}>
        <Img src={staticFile(A("qr_audio_0B7_labeled.png"))} style={{ width: "100%", display: "block" }} />
      </div>
      <svg style={{ position: "absolute", inset: 0, opacity: p }} width={1920} height={1080}>
        <line x1={lineFrom.x} y1={lineFrom.y} x2={ax - 40} y2={ay - 14} stroke="#fff" strokeWidth={3.5} strokeDasharray="10 7" />
        <circle cx={ax} cy={ay} r={44} fill="none" stroke="#fff" strokeWidth={4} />
      </svg>
    </>
  );
};

const AirRaidBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const s1Scale = interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.s2aStart, T.s2aStart + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push2 = interpolate(frame, [T.s2aStart, T.s2bStart + 10], [1, 1.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const in3 = interpolate(frame, [T.s2bStart, T.s2bStart + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push3 = interpolate(frame, [T.s2bStart, T.scanEnd + 20], [1.05, 1.32], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgDim = interpolate(frame, [T.scanEnd - 10, T.scanEnd + 20], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>
    {frame < T.s2aStart + 16 && <Img src={staticFile(A("scene1_0B7.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />}
    {frame >= T.s2aStart && frame < T.s2bStart + 14 && (
      <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${push2})`, transformOrigin: `${SPOT2.x} ${SPOT2.y}` }}>
        <Img src={staticFile(A("scene2_0B7_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    {frame >= T.s2bStart && (
      <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
        <Img src={staticFile(A("scene3_0B7_close.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />
  </>;
};

export const AirRaidDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <AirRaidBackground />

      {/* 段1 覆蓋層：功能標示卡＋左側 QR 放大示意（指向說明牌上的 QR） */}
      <Sequence from={0} durationInFrames={T.functionStart}>
        <TitleCard index={1} title="語音導覽" subtitle="掃描展板 QR，開啟該展項語音解說" enterFrame={2} />
        <QrCallout enterFrame={24} bgScaleOf={(f) => interpolate(f, [0, T.s2aStart + 18], [1.05, 1.12])} />
      </Sequence>

      {/* 段2 掃碼＋段3 功能：手機（不能包 Sequence，否則子元件幀號變相對值） */}
      {frame >= T.phoneIn - 5 && (
        <PhoneFrame enterFrame={T.phoneIn} x={380} hand={A("hand_hold.png")}>
          {/* 掃描相機畫面（對準展台說明牌上的 QR） */}
          {frame < T.scanEnd && <ScanView bg={A("scan_panel.png")} from={T.phoneIn + 10} to={T.scanEnd} />}
          {/* App 語音導覽分頁（原型實截：中文播放中） */}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A("app_tw_play.png"))} style={{ position: "absolute", width: "100%" }} />
            </>
          )}
        </PhoneFrame>
      )}

      {/* 功能旁白（開場段無音軌） */}
      <Sequence from={VO.guide}><Audio src={staticFile(A("vo_airraid_guide_tw.mp3"))} /></Sequence>

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "不妨掃描展板 QR Code，聽聽語音解說。", from: VO.guide, to: 296 },
        { text: "一九四四年空襲造成桁架變形，痕跡至今仍在。", from: 296, to: 560 },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <EndCard feature="掃描展板 QR，開啟語音解說" index={1} fade={fade} />
    </AbsoluteFill>
  );
};
