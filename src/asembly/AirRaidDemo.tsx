import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, PhoneFrame, QrCard, ScanView, Subtitle, TapCursor, TitleCard } from "./shared";

// ═══ 時間軸常數（30fps，總長 19s＝570f；要改節奏改這裡）═══════════
const T = {
  s2Start: 165,      // 段2 開始（5.5s）
  scanEnd: 225,      // 掃描完成→跳轉 App（7.5s）
  s3Start: 414,      // 段3 開始（13.8s）
  jpSwitch: 444,     // 日文介面切換點（14.8s）
  fadeOut: 540,      // 結尾淡出（18s）
  total: 570,
};
const VO = { s1: 9, s2: 174, s3: 426 }; // 三段旁白起點

const A = (p: string) => `asembly/airraid/${p}`;

export const AirRaidDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const bgScale = interpolate(frame, [0, T.total], [1.05, 1.14]);
  const bgDim = interpolate(frame, [T.s2Start - 15, T.s2Start + 15], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* 背景：p270 渲染圖經 Nano Banana 去紅標註重製（bg_scene_v2） */}
      <Img src={staticFile(A("bg_scene_v2.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${bgScale})` }} />
      <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />

      {/* 段1：標示卡＋QR 立牌 */}
      <Sequence from={0} durationInFrames={T.s2Start}>
        <TitleCard title="空襲——望遠鏡互動裝置" subtitle="透過望遠鏡，看見二戰空襲在廠房桁架留下的痕跡" enterFrame={10} />
        <QrCard src={A("qr.png")} label="掃描 QR code・語音導覽" enterFrame={26} />
      </Sequence>

      {/* 段2＋段3：手機（恆掛，PhoneFrame 以 spring 控進場；不能包 Sequence，否則子元件幀號變相對值） */}
      {frame >= T.s2Start - 5 && (
        <PhoneFrame enterFrame={T.s2Start}>
          {/* 掃描相機畫面 */}
          {frame < T.scanEnd && <ScanView bg={A("bg_scene_v2.png")} qr={A("qr.png")} from={T.s2Start + 8} to={T.scanEnd} />}
          {/* App 語音導覽分頁（原型實截：中文播放中 → 日文播放中） */}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A("app_tw_play.png"))} style={{ position: "absolute", width: "100%", opacity: frame >= T.jpSwitch ? 0 : 1 }} />
              <Img src={staticFile(A("app_jp_play.png"))} style={{ position: "absolute", width: "100%", opacity: interpolate(frame, [T.jpSwitch - 4, T.jpSwitch + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
            </>
          )}
          {/* 段3：手指點 JP（座標對應 390×844 螢幕內 header 語言鈕） */}
          <TapCursor fromXY={[195, 700]} toXY={[310, 32]} start={T.s3Start} tapAt={T.jpSwitch - 4} end={T.jpSwitch + 14} />
        </PhoneFrame>
      )}

      {/* 旁白 */}
      <Sequence from={VO.s1}><Audio src={staticFile(A("vo_s1_invite.mp3"))} /></Sequence>
      <Sequence from={VO.s2}><Audio src={staticFile(A("vo_s2_guide.mp3"))} /></Sequence>
      <Sequence from={VO.s3}><Audio src={staticFile(A("vo_s3_ja.mp3"))} volume={(f) => interpolate(f, [96, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} /></Sequence>

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "想邊看邊聽這座望遠鏡的故事？掃一下 QR code，我說給你聽。", from: VO.s1, to: 168 },
        { text: "1944 年，空襲警報劃過組立工場上空。", from: VO.s2, to: 288 },
        { text: "抬頭看，桁架上變形的痕跡，就是歷史的證據。", from: 288, to: 412 },
        { text: "頭上の鉄骨には、空襲の傷跡が残っています。", small: "（頭上鋼架，仍留著空襲的傷痕。）", from: VO.s3, to: 546 },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      {fade > 0.6 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: (fade - 0.6) / 0.4 }}>
          <div style={{ color: "#e8ecf2", fontSize: 34, letterSpacing: 6, fontWeight: 600 }}>組立工場行動導覽・語音導覽</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
