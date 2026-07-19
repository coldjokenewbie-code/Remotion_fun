import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FingerTap, FONT, PhoneFrame, ScanView, Subtitle, TitleCard } from "./shared";

// ═══ 時間軸常數（30fps，總長 24.2s＝726f；要改節奏改這裡）═══════════
// 空間圖 v3（PO 提供 0B-7 展台渲染三連）：scene1 亮景全景 → scene2 暗景中景（QR 聚光）→ scene3 近景正視
// 旁白 v2 降速後實長：s1=7.22s(217f)、s2=9.98s(300f)、s3=4.80s(144f)
const T = {
  s2aStart: 120,     // 段2a：切暗景中景，推向 QR 聚光（4.0s）
  s2bStart: 174,     // 段2b：切近景正視（5.8s）
  phoneIn: 180,      // 手機入鏡（6.0s）
  scanEnd: 232,      // 掃描完成→跳轉 App（7.7s）
  s4Start: 542,      // 段4：手指移向 JP（18.1s）
  jpSwitch: 562,     // 日文介面切換點（18.7s）
  fadeOut: 700,      // 結尾淡出（23.3s）
  total: 726,
};
const VO = { s1: 9, s2: 240, s3: 568 }; // 三段旁白起點

const A = (p: string) => `asembly/airraid/${p}`;
const QR = A("qr_audio_0B7_badge.png"); // p5 樣式語音導覽 QR，深連結 exhibit/0B-7?f=audio
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

export const AirRaidDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const s1Scale = interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.s2aStart, T.s2aStart + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push2 = interpolate(frame, [T.s2aStart, T.s2bStart + 10], [1.0, 1.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const in3 = interpolate(frame, [T.s2bStart, T.s2bStart + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push3 = interpolate(frame, [T.s2bStart, T.scanEnd + 20], [1.05, 1.32], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgDim = interpolate(frame, [T.scanEnd - 10, T.scanEnd + 20], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* 段1：亮景全景（展台＋望遠鏡＋訪客） */}
      {frame < T.s2aStart + 16 && (
        <Img src={staticFile(A("scene1_0B7.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />
      )}

      {/* 段2a：暗景中景，QR 聚光提示，鏡頭推向聚光點 */}
      {frame >= T.s2aStart && frame < T.s2bStart + 14 && (
        <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${push2})`, transformOrigin: `${SPOT2.x} ${SPOT2.y}` }}>
          <Img src={staticFile(A("scene2_0B7_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* 段2b～段4：近景正視（展台說明牌＋QR 聚光，原圖自帶 highlight），續推 */}
      {frame >= T.s2bStart && (
        <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
          <Img src={staticFile(A("scene3_0B7_close.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />

      {/* 段1 覆蓋層：功能標示卡＋左側 QR 放大示意（指向說明牌上的 QR） */}
      <Sequence from={0} durationInFrames={T.s2aStart}>
        <TitleCard title="語音導覽" subtitle="示範展項：空襲——望遠鏡互動裝置" enterFrame={10} />
        <QrCallout enterFrame={30} bgScaleOf={(f) => interpolate(f, [0, T.s2aStart + 18], [1.05, 1.12])} />
      </Sequence>

      {/* 段2 掃碼＋段3 功能＋段4 切日文：手機（不能包 Sequence，否則子元件幀號變相對值） */}
      {frame >= T.phoneIn - 5 && (
        <PhoneFrame enterFrame={T.phoneIn} x={380} hand={A("hand_hold.png")}
          overlay={<FingerTap src={A("finger_tap.png")} tip={[625, 186]} imgSize={1024} scale={1.0}
            target={[315, 37]} start={T.s4Start} tapAt={T.jpSwitch - 4} end={T.jpSwitch + 34} from={[-560, 960]} />}>
          {/* 掃描相機畫面（對準展台說明牌上的 QR） */}
          {frame < T.scanEnd && <ScanView bg={A("scene3_0B7_close.png")} qr={QR} from={T.phoneIn + 10} to={T.scanEnd} />}
          {/* App 語音導覽分頁（原型實截：中文播放中 → 日文播放中） */}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A("app_tw_play.png"))} style={{ position: "absolute", width: "100%", opacity: frame >= T.jpSwitch ? 0 : 1 }} />
              <Img src={staticFile(A("app_jp_play.png"))} style={{ position: "absolute", width: "100%", opacity: interpolate(frame, [T.jpSwitch - 4, T.jpSwitch + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
            </>
          )}
        </PhoneFrame>
      )}

      {/* 旁白 v2（YunJhe -8%/-4Hz 年長沉穩、Keita -5%） */}
      <Sequence from={VO.s1}><Audio src={staticFile(A("vo_s1_invite_v2.mp3"))} /></Sequence>
      <Sequence from={VO.s2}><Audio src={staticFile(A("vo_s2_guide_v2.mp3"))} /></Sequence>
      <Sequence from={VO.s3}><Audio src={staticFile(A("vo_s3_ja_v2.mp3"))} volume={(f) => interpolate(f, [120, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} /></Sequence>

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "想邊看邊聽這座望遠鏡的故事？掃一下 QR code，我說給你聽。", from: VO.s1, to: 230 },
        { text: "1944 年，空襲警報劃過組立工場上空。", from: VO.s2, to: 380 },
        { text: "抬頭看，桁架上變形的痕跡，就是歷史的證據。", from: 380, to: 540 },
        { text: "頭上の鉄骨には、空襲の傷跡が残っています。", small: "（頭上鋼架，仍留著空襲的傷痕。）", from: VO.s3, to: 714 },
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
