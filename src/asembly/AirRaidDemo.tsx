import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EndCard, FONT, PhoneFrame, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ 時間軸常數（30fps；開場依序呈現標示卡、QR 示意、掃描）════════════════
// 空間圖 v3（PO 提供 0B-7 展台渲染三連）：scene1 亮景全景 → scene2 暗景中景（QR 聚光）→ scene3 近景正視
// 開場靜音；PO 20260720 指定中文 10–12s＋日文 5–7s
const T = {
  s2aStart: 36,
  s2bStart: 58,
  phoneIn: 64,
  functionStart: 160,
  scanEnd: 160,
  japaneseStart: 510,
  fadeOut: 708,
  total: 732,
};
const VO = { guide: 160, japanese: 510 };

const A = (p: string) => `asembly/airraid/${p}`;
// 聚光點（PIL 亮度質心量測，objectFit cover 換算後畫布座標）
const SPOT2 = { x: "19.7%", y: "69.5%" }; // PO 2026-07-17 更新版 scene2（2047×1066）重量測
const SPOT3 = { x: "12.5%", y: "56%" };
// v7 實圖量測：scene1 cover 座標；scan_panel 為 480×1040 座標。
const SCENE_QR = { x: 653, y: 810, size: 16 };
const SCAN_QR = { x: 209, y: 557, size: 140 };

const MultiLanguageCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [T.japaneseStart - 8, T.japaneseStart + 6], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "absolute", left: 72, top: 300, width: 650, opacity, fontFamily: FONT,
      background: "rgba(15,18,25,0.86)", borderLeft: "6px solid #ff8a3d", borderRadius: 10,
      padding: "22px 28px", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
      <div style={{ color: "#ffad73", fontSize: 22, fontWeight: 800, letterSpacing: 4 }}>多語服務</div>
      <div style={{ color: "#fff", fontSize: 30, fontWeight: 650, marginTop: 10 }}>
        同一展項支援中・英・日語音與介面切換
      </div>
    </div>
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
      </Sequence>
      <Sequence from={0} durationInFrames={T.s2aStart}>
        <SceneQrCallout src={A("qr_audio_0B7_labeled.png")} enterFrame={20} target={SCENE_QR}
          backgroundScale={interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12])} />
      </Sequence>

      {/* 段2 掃碼＋段3 功能：手機（不能包 Sequence，否則子元件幀號變相對值） */}
      {frame >= T.phoneIn - 5 && (
        <PhoneFrame enterFrame={T.phoneIn} x={380} hand={A("hand_hold.png")}>
          {/* 掃描相機畫面（對準展台說明牌上的 QR） */}
          {frame < T.scanEnd && <ScanView bg={A("scan_panel.png")} from={T.phoneIn + 10} to={T.scanEnd} qr={SCAN_QR} />}
          {/* App 語音導覽分頁（原型實截：中文播放中） */}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A(frame < T.japaneseStart ? "app_tw_play.png" : "app_jp_play.png"))} style={{ position: "absolute", width: "100%" }} />
            </>
          )}
        </PhoneFrame>
      )}

      {/* 功能旁白（開場段無音軌） */}
      <Sequence from={VO.guide}><Audio src={staticFile(A("vo_airraid_guide_tw.mp3"))} /></Sequence>
      <Sequence from={VO.japanese}><Audio src={staticFile(A("vo_s3_ja_v2.mp3"))} /></Sequence>
      {frame >= T.japaneseStart - 8 && frame < T.fadeOut && <MultiLanguageCard />}

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "一九四四年空襲使桁架留下變形痕跡；操作望遠鏡對準屋架，即可辨識受損位置。", from: VO.guide, to: VO.japanese },
        { text: "1944年の空襲で変形した鉄骨を、望遠鏡型装置で確認できます。", small: "一九四四年空襲留下的桁架變形，可透過望遠鏡型裝置確認。", from: VO.japanese, to: 708 },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <EndCard feature="語音導覽與中・英・日多語服務" index={1} fade={fade} />
    </AbsoluteFill>
  );
};
