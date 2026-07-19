import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FingerTap, FONT, PhoneFrame, ScanView, Subtitle, TitleCard } from "./shared";

// ═══ AR 導覽功能示範（G-1-3 機坑×台工1677）──時間軸常數（30fps，總長 22.6s＝678f）═══
// 空間圖：PO 提供 G-3-機坑三連（scene1 亮景全景→scene2 訪客舉手機→scene3 調暗＋說明牌 QR 聚光）
// 旁白：s1=7.80s(234f)、s2=12.98s(390f)（YunJhe -8%/-4Hz）
const T = {
  s2aStart: 120,     // 段2a：切訪客舉手機視角（4.0s）
  s2bStart: 174,     // 段2b：切暗景聚光，推向說明牌 QR（5.8s）
  phoneIn: 186,      // 手機入鏡（6.2s）
  scanEnd: 244,      // 掃描完成→跳轉 App AR 分頁（8.1s）
  arTap: 445,        // 手指點按啟動 AR（14.8s）
  arReveal: 452,     // 台工1677 AR 重現 crossfade（15.1s）
  fadeOut: 650,      // 結尾淡出（21.7s）
  total: 678,
};
const VO = { s1: 9, s2: 252 };

const A = (p: string) => `asembly/ardemo/${p}`;
const QR = A("qr_ar_G13_badge.png"); // p5 橘款 AR 探索 QR，深連結 exhibit/G-1-3?f=ar
// scene1 說明牌 QR 畫布座標（cover 換算 scale=1 基準）；scene3 聚光點（畫面百分比）
const QR1 = { x: 611, y: 533 }; // 面板上橘色 AR QR（面板另有綠色語音導覽 QR，勿圈錯）
const SPOT3 = { x: "12.3%", y: "50.9%" };

// ── 段1 左側 QR 放大示意（同空襲片 v3.5 作法）──
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
        <Img src={staticFile(A("qr_ar_G13_labeled.png"))} style={{ width: "100%", display: "block" }} />
      </div>
      <svg style={{ position: "absolute", inset: 0, opacity: p }} width={1920} height={1080}>
        <line x1={lineFrom.x} y1={lineFrom.y} x2={ax - 28} y2={ay - 8} stroke="#fff" strokeWidth={3.5} strokeDasharray="10 7" />
        <circle cx={ax} cy={ay} r={28} fill="none" stroke="#fff" strokeWidth={4} />
      </svg>
    </>
  );
};

export const ARDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const s1Scale = interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.s2aStart, T.s2aStart + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s2Scale = interpolate(frame, [T.s2aStart, T.s2bStart + 10], [1.0, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const in3 = interpolate(frame, [T.s2bStart, T.s2bStart + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push3 = interpolate(frame, [T.s2bStart, T.scanEnd + 20], [1.02, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgDim = interpolate(frame, [T.scanEnd - 10, T.scanEnd + 20], [0, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const revealP = interpolate(frame, [T.arReveal - 4, T.arReveal + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* 段1：亮景全景（機坑＋說明牌＋參觀者） */}
      {frame < T.s2aStart + 16 && (
        <Img src={staticFile(A("scene1_G13.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />
      )}

      {/* 段2a：訪客於說明牌前舉起手機（亮景正面） */}
      {frame >= T.s2aStart && frame < T.s2bStart + 14 && (
        <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${s2Scale})` }}>
          <Img src={staticFile(A("scene2_G13.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* 段2b～段4：暗景聚光（說明牌 QR highlight，原圖自帶），推鏡 */}
      {frame >= T.s2bStart && (
        <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
          <Img src={staticFile(A("scene3_G13_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />

      {/* 段1 覆蓋層：功能標示卡＋左側 QR 放大示意 */}
      <Sequence from={0} durationInFrames={T.s2aStart}>
        <TitleCard title="AR 探索" subtitle="示範展項：機坑與台工1677 高速車輪鏇床" enterFrame={10} />
        <QrCallout enterFrame={30} bgScaleOf={(f) => interpolate(f, [0, T.s2aStart + 18], [1.05, 1.12])} />
      </Sequence>

      {/* 手機（不能包 Sequence，否則子元件幀號變相對值）：掃描→AR 分頁→點按→台工1677 重現 */}
      {frame >= T.phoneIn - 5 && (
        <PhoneFrame enterFrame={T.phoneIn} x={380} hand={A("hand_hold.png")}
          overlay={<FingerTap src={A("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={1.0}
            target={[200, 713]} start={T.arTap - 30} tapAt={T.arTap} end={T.arTap + 44} from={[-560, 500]} />}>
          {frame < T.scanEnd && <ScanView bg={A("scene3_G13_dim.png")} qr={QR} from={T.phoneIn + 10} to={T.scanEnd} doneLabel="✓ 已辨識・開啟 AR 探索" />}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A("app_ar_before.png"))} style={{ position: "absolute", width: "100%", opacity: 1 - revealP }} />
              <Img src={staticFile(A("app_ar_after.png"))} style={{ position: "absolute", width: "100%", opacity: revealP }} />
            </>
          )}
        </PhoneFrame>
      )}

      {/* 旁白 */}
      <Sequence from={VO.s1}><Audio src={staticFile(A("vo_ar_s1_invite.mp3"))} /></Sequence>
      <Sequence from={VO.s2}><Audio src={staticFile(A("vo_ar_s2_reveal.mp3"))} /></Sequence>

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "這個坑，以前站著一台大傢伙。掃一下 QR code，我請它回來給你看。", from: VO.s1, to: 248 },
        { text: "台工1677 高速車輪鏇床，現在人在富岡機廠。", from: VO.s2, to: 424 },
        { text: "用 AR，我把它請回原本的位置——", from: 424, to: 540 },
        { text: "你看，這就是當年的氣勢。", from: 540, to: 644 },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      {fade > 0.6 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: (fade - 0.6) / 0.4 }}>
          <div style={{ color: "#e8ecf2", fontSize: 34, letterSpacing: 6, fontWeight: 600 }}>組立工場行動導覽・AR 探索</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
