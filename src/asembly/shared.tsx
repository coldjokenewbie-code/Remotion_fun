import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, Img } from "remotion";

export const FONT = '"Noto Sans TC", "PingFang TC", "Heiti TC", sans-serif';

// ── 標示卡（左上：展項名稱＋簡介）──────────────────────────────
export const TitleCard: React.FC<{ title: string; subtitle: string; enterFrame: number }> = ({ title, subtitle, enterFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  return (
    <div style={{
      position: "absolute", top: 56, left: 64, maxWidth: 980,
      transform: `translateX(${interpolate(p, [0, 1], [-60, 0])}px)`, opacity: p,
      background: "rgba(15,18,25,0.78)", backdropFilter: "blur(6px)",
      borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "22px 30px", fontFamily: FONT,
    }}>
      <div style={{ color: "#fff", fontSize: 44, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
      <div style={{ color: "#d8dde6", fontSize: 24, marginTop: 8, letterSpacing: 1 }}>{subtitle}</div>
    </div>
  );
};

// ── QR 立牌卡（右下）────────────────────────────────────────────
export const QrCard: React.FC<{ src: string; label: string; enterFrame: number }> = ({ src, label, enterFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  const pulse = 1 + 0.02 * Math.sin((frame - enterFrame) / 7);
  return (
    <div style={{
      position: "absolute", right: 72, bottom: 150,
      transform: `translateY(${interpolate(p, [0, 1], [80, 0])}px) scale(${pulse})`, opacity: p,
      background: "#fff", borderRadius: 14, padding: 18, textAlign: "center",
      boxShadow: "0 12px 40px rgba(0,0,0,0.45)", fontFamily: FONT,
    }}>
      <Img src={staticFile(src)} style={{ width: 170, height: 170 }} />
      <div style={{ fontSize: 19, fontWeight: 700, color: "#1a2233", marginTop: 8, letterSpacing: 1 }}>{label}</div>
    </div>
  );
};

// ── 字幕（底部置中；jp 可附中文小字）────────────────────────────
export const Subtitle: React.FC<{ lines: { text: string; from: number; to: number; small?: string }[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const line = lines.find((l) => frame >= l.from && frame < l.to);
  if (!line) return null;
  const fade = Math.min(1, (frame - line.from) / 6, (line.to - frame) / 6);
  return (
    <div style={{ position: "absolute", bottom: 46, width: "100%", textAlign: "center", opacity: fade, fontFamily: FONT }}>
      <span style={{
        background: "rgba(10,12,16,0.72)", color: "#fff", fontSize: 34, fontWeight: 600,
        padding: "10px 28px", borderRadius: 10, letterSpacing: 1.5, lineHeight: 1.5,
      }}>{line.text}</span>
      {line.small && (
        <div style={{ marginTop: 10 }}>
          <span style={{ background: "rgba(10,12,16,0.6)", color: "#cfd6e0", fontSize: 22, padding: "5px 16px", borderRadius: 8 }}>{line.small}</span>
        </div>
      )}
    </div>
  );
};

// ── 手機外框：screen 內容由 children 提供；hand 可選（手持示意，隨手機進場）──
export const PhoneFrame: React.FC<{ enterFrame: number; x?: number; hand?: string; overlay?: React.ReactNode; children: React.ReactNode }> = ({ enterFrame, x = 0, hand, overlay, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  const W = 400, H = 866; // 螢幕 390×844 + 邊框
  return (
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${interpolate(p, [0, 1], [420, 0])}px)) scale(1.06)`,
      opacity: p, width: W, height: H, borderRadius: 54, background: "#0c0d10",
      padding: 5, boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px #2a2d33",
    }}>
      <div style={{ width: 390, height: 844, borderRadius: 49, overflow: "hidden", position: "relative", background: "#111" }}>
        {children}
      </div>
      {/* 手持示意：去背手部素材，手機黑板區已挖空（對位：gen 機身 bbox 296-691×105-852 → 本框 400×866） */}
      {hand && (
        <Img src={staticFile(hand)} style={{
          position: "absolute", left: -300, top: 3, width: 1037, height: 1037,
          maxWidth: "none", pointerEvents: "none",
        }} />
      )}
      {overlay}
    </div>
  );
};

// ── 手指點按（去背食指素材；tip＝素材內指尖座標；target＝手機外框座標系）──
export const FingerTap: React.FC<{
  src: string; tip: [number, number]; imgSize: number; scale: number;
  target: [number, number]; start: number; tapAt: number; end: number; from?: [number, number];
}> = ({ src, tip, imgSize, scale, target, start, tapAt, end, from = [150, 280] }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;
  // 手不透明（真人手不會半透明）：進出場全靠位移——從 from 向量外滑入、原路滑出
  const tIn = interpolate(frame, [start, tapAt - 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const back = interpolate(frame, [tapAt + 12, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const disp = Math.min(1, (1 - tIn) + back);
  const dx = from[0] * disp;
  const dy = from[1] * disp;
  const appear = back < 0.7 ? 1 : 1 - (back - 0.7) / 0.3; // 僅離場末端（已在暗背景上）淡出防跳切
  const press = frame >= tapAt - 2 && frame < tapAt + 4 ? 0.96 : 1; // 指尖下壓
  const x = target[0] + dx, y = target[1] + dy;
  const rippleT = frame >= tapAt ? Math.min(1, (frame - tapAt) / 12) : 0;
  return (
    <>
      {rippleT > 0 && rippleT < 1 && (
        <div style={{
          position: "absolute", left: target[0], top: target[1],
          width: 30 + 64 * rippleT, height: 30 + 64 * rippleT, borderRadius: "50%",
          border: "3px solid rgba(255,138,61,0.9)", opacity: 1 - rippleT,
          transform: "translate(-50%,-50%)", pointerEvents: "none",
        }} />
      )}
      <Img src={staticFile(src)} style={{
        position: "absolute", left: x - tip[0] * scale, top: y - tip[1] * scale,
        width: imgSize * scale, height: imgSize * scale, maxWidth: "none",
        opacity: appear, pointerEvents: "none",
        transform: `scale(${press})`, transformOrigin: `${tip[0] * scale}px ${tip[1] * scale}px`,
        filter: "drop-shadow(-6px 10px 14px rgba(0,0,0,0.35))",
      }} />
    </>
  );
};

// ── 掃描視圖（相機畫面：背景＋QR＋掃描線）───────────────────────
export const ScanView: React.FC<{ bg: string; qr: string; from: number; to: number; doneLabel?: string }> = ({ bg, qr, from, to, doneLabel = "✓ 已辨識・開啟語音導覽" }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scanY = 260 + 300 * (0.5 - 0.5 * Math.cos(t * Math.PI * 4)); // 上下掃兩趟
  const locked = t > 0.82;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img src={staticFile(bg)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.6)", filter: "brightness(0.9)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />
      {/* QR 在畫面中央 */}
      <div style={{
        position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)",
        background: "#fff", padding: 12, borderRadius: 10, boxShadow: locked ? "0 0 0 5px #35d07f" : "none",
      }}>
        <Img src={staticFile(qr)} style={{ width: 150, height: 150 }} />
      </div>
      {/* 取景框四角 */}
      {([[0, 0], [1, 0], [0, 1], [1, 1]] as const).map(([cx, cy], i) => (
        <div key={i} style={{
          position: "absolute", left: `calc(50% + ${cx ? 105 : -135}px)`, top: `calc(44% + ${cy ? 105 : -135}px)`,
          width: 30, height: 30,
          borderTop: cy ? "none" : "5px solid #fff", borderBottom: cy ? "5px solid #fff" : "none",
          borderLeft: cx ? "none" : "5px solid #fff", borderRight: cx ? "5px solid #fff" : "none",
          opacity: 0.95,
        }} />
      ))}
      {/* 掃描線 */}
      {!locked && <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: scanY, width: 268, height: 3, background: "linear-gradient(90deg, transparent, #35d07f, transparent)" }} />}
      {locked && (
        <div style={{ position: "absolute", left: "50%", top: "62%", transform: "translateX(-50%)", color: "#35d07f", fontFamily: FONT, fontSize: 20, fontWeight: 700, background: "rgba(0,0,0,0.55)", padding: "6px 16px", borderRadius: 20 }}>
          {doneLabel}
        </div>
      )}
    </div>
  );
};

// ── 點擊手指游標（移動→按壓漣漪）────────────────────────────────
export const TapCursor: React.FC<{ fromXY: [number, number]; toXY: [number, number]; start: number; tapAt: number; end: number }> = ({ fromXY, toXY, start, tapAt, end }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;
  const t = interpolate(frame, [start, tapAt], [0, 1], { extrapolateRight: "clamp" });
  const x = fromXY[0] + (toXY[0] - fromXY[0]) * t;
  const y = fromXY[1] + (toXY[1] - fromXY[1]) * t;
  const rippleT = frame >= tapAt ? Math.min(1, (frame - tapAt) / 12) : 0;
  return (
    <>
      <div style={{
        position: "absolute", left: x, top: y, width: 34, height: 34, borderRadius: "50%",
        background: "rgba(255,255,255,0.85)", border: "2px solid rgba(0,0,0,0.25)",
        transform: `translate(-50%,-50%) scale(${frame >= tapAt && frame < tapAt + 6 ? 0.75 : 1})`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
      }} />
      {rippleT > 0 && rippleT < 1 && (
        <div style={{
          position: "absolute", left: x, top: y, width: 34 + 70 * rippleT, height: 34 + 70 * rippleT,
          borderRadius: "50%", border: "3px solid rgba(255,138,61,0.9)", opacity: 1 - rippleT,
          transform: "translate(-50%,-50%)",
        }} />
      )}
    </>
  );
};
