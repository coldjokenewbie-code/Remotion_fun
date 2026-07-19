import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EndCard, FingerTap, FONT, PhoneFrame, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ AR 導覽功能示範（G-1-3 機坑×台工1677）──時間軸常數（30fps，總長 15s＝450f）════
// 空間圖：PO 提供 G-3-機坑三連（scene1 亮景全景→scene2 訪客舉手機→scene3 調暗＋說明牌 QR 聚光）
// 本片無旁白；以字幕串接功能敘事
const T = {
  s2aStart: 30,
  s2bStart: 48,
  phoneIn: 38,
  functionStart: 72,
  scanEnd: 72,
  arTap: 260,
  arReveal: 267,
  fadeOut: 426,
  total: 450,
};
const A = (p: string) => `asembly/ardemo/${p}`;
// v7 實圖量測：橘色 AR QR；面板旁另有綠色語音 QR，勿圈錯。
const SCENE_QR = { x: 608, y: 532, size: 14 };
const SCAN_QR = { x: 176, y: 529, size: 107 };
const SPOT3 = { x: "12.3%", y: "50.9%" };

const ARBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const s1Scale = interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.s2aStart, T.s2aStart + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s2Scale = interpolate(frame, [T.s2aStart, T.s2bStart + 10], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const in3 = interpolate(frame, [T.s2bStart, T.s2bStart + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push3 = interpolate(frame, [T.s2bStart, T.scanEnd + 20], [1.02, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgDim = interpolate(frame, [T.scanEnd - 10, T.scanEnd + 20], [0, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>
    {frame < T.s2aStart + 16 && <Img src={staticFile(A("scene1_G13.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />}
    {frame >= T.s2aStart && frame < T.s2bStart + 14 && (
      <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${s2Scale})` }}>
        <Img src={staticFile(A("scene2_G13.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    {frame >= T.s2bStart && (
      <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
        <Img src={staticFile(A("scene3_G13_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />
  </>;
};

export const ARDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const revealP = interpolate(frame, [T.arReveal - 4, T.arReveal + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <ARBackground />

      {/* 段1 覆蓋層：功能標示卡＋左側 QR 放大示意 */}
      <Sequence from={0} durationInFrames={T.functionStart}>
        <TitleCard index={2} title="AR 探索" subtitle="掃描展板 QR，在原址疊合機具歷史影像" enterFrame={5} />
      </Sequence>
      <Sequence from={0} durationInFrames={T.s2aStart}>
        <SceneQrCallout src={A("qr_ar_G13_labeled.png")} enterFrame={15} target={SCENE_QR}
          backgroundScale={interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12])} />
      </Sequence>

      {/* 手機（不能包 Sequence，否則子元件幀號變相對值）：掃描→AR 分頁→點按→台工1677 重現 */}
      {frame >= T.phoneIn - 5 && (
        <PhoneFrame enterFrame={T.phoneIn} x={380} hand={A("hand_hold.png")}
          overlay={<FingerTap src={A("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={1.0}
            target={[200, 713]} start={T.arTap - 30} tapAt={T.arTap} end={T.arTap + 44} from={[-560, 500]} />}>
          {frame < T.scanEnd && <ScanView bg={A("scan_panel.png")} from={T.phoneIn + 10} to={T.scanEnd} qr={SCAN_QR} doneLabel="✓ 已辨識・開啟 AR 探索" />}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A("app_ar_before.png"))} style={{ position: "absolute", width: "100%", opacity: 1 - revealP }} />
              <Img src={staticFile(A("app_ar_after.png"))} style={{ position: "absolute", width: "100%", opacity: revealP }} />
            </>
          )}
        </PhoneFrame>
      )}

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "掃描展板 QR，開啟 AR 模式。", from: 80, to: 150 },
        { text: "系統辨識展項位置與台工 1677 機具資料。", from: 150, to: 230 },
        { text: "點選畫面按鈕，在機坑原址疊合機具影像。", from: 230, to: 330 },
        { text: "畫面可對照機坑現況與機具原貌。", from: 330, to: 420 },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <EndCard feature="AR 於展項原址呈現機具影像" index={2} fade={fade} />
    </AbsoluteFill>
  );
};
