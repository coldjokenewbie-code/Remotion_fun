import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig, staticFile, Img } from "remotion";

export const FONT = '"Noto Sans TC", "PingFang TC", "Heiti TC", sans-serif';

export type QrGeometry = { x: number; y: number; size: number };

// ── 標示卡（左上：展項名稱＋簡介）──────────────────────────────
export const TitleCard: React.FC<{ title: string; subtitle: string; enterFrame: number; index: number }> = ({ title, subtitle, enterFrame }) => {
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
      <div style={{ color: "#ffad73", fontSize: 18, fontWeight: 800, letterSpacing: 4 }}>導覽功能</div>
      <div style={{ color: "#fff", fontSize: 44, fontWeight: 700, letterSpacing: 2, marginTop: 8 }}>{title}</div>
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

export const SceneQrCallout: React.FC<{
  src: string; enterFrame: number; target: QrGeometry;
  backgroundScale?: number; card?: { x: number; y: number; width: number };
}> = ({ src, enterFrame, target, backgroundScale = 1, card = { x: 140, y: 400, width: 320 } }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [enterFrame, enterFrame + 14], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const targetX = 960 + (target.x - 960) * backgroundScale;
  const targetY = 540 + (target.y - 540) * backgroundScale;
  const isCardLeft = card.x + card.width / 2 < targetX;
  const lineX = isCardLeft ? card.x + card.width + 6 : card.x - 6;
  const lineY = card.y + card.width * 0.5;
  const targetEdgeX = targetX + (isCardLeft ? -target.size / 2 : target.size / 2);
  return <>
    <div style={{
      position: "absolute", left: card.x, top: card.y, width: card.width,
      transform: `translateX(${interpolate(progress, [0, 1], [-80, 0])}px)`, opacity: progress,
      background: "#fff", borderRadius: 14, padding: 10,
      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
    }}>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
    <svg style={{ position: "absolute", inset: 0, opacity: progress }} width={1920} height={1080}>
      <line x1={lineX} y1={lineY} x2={targetEdgeX} y2={targetY} stroke="#fff" strokeWidth={3.5} strokeDasharray="10 7" />
      <circle cx={targetX} cy={targetY} r={Math.max(24, target.size * 0.7)} fill="none" stroke="#fff" strokeWidth={4} />
    </svg>
  </>;
};

// ── 手機拉出示意（實景定點→白色楔形光束→手機背板）：避免手持手機像對空曠拍照 ──
export const PhoneCallout: React.FC<{
  anchor: { x: number; y: number }; visibleFrom: number; visibleTo: number;
  phoneX?: number; showRing?: boolean;
}> = ({ anchor, visibleFrom, visibleTo, phoneX = 380, showRing = true }) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [visibleFrom, visibleFrom + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outP = interpolate(frame, [visibleTo - 12, visibleTo], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p = Math.min(inP, outP);
  if (p <= 0.001) return null;
  const W = 400, H = 866, PAD = 16;
  const cx = 960 + phoneX, cy = 540;
  const panelLeft = cx - W / 2 - PAD, panelTop = cy - H / 2 - PAD;
  const panelW = W + PAD * 2, panelH = H + PAD * 2;
  const wedgeSpan = 300;
  const topY = cy - wedgeSpan / 2, botY = cy + wedgeSpan / 2;
  return <>
    <svg style={{ position: "absolute", inset: 0, opacity: p }} width={1920} height={1080}>
      <defs>
        <linearGradient id="pcw" x1={anchor.x} y1={anchor.y} x2={panelLeft} y2={cy} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.38)" />
        </linearGradient>
      </defs>
      <polygon points={`${anchor.x},${anchor.y} ${panelLeft},${topY} ${panelLeft},${botY}`} fill="url(#pcw)" />
      <line x1={anchor.x} y1={anchor.y} x2={panelLeft} y2={topY} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      <line x1={anchor.x} y1={anchor.y} x2={panelLeft} y2={botY} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      {showRing && <>
        <circle cx={anchor.x} cy={anchor.y} r={26} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={3} />
        <circle cx={anchor.x} cy={anchor.y} r={34} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
      </>}
    </svg>
    {/* 貼身細白框：標示「此為拉出的手機畫面」而不搶背景 */}
    <div style={{
      position: "absolute", left: panelLeft, top: panelTop, width: panelW, height: panelH,
      borderRadius: 62, border: "2.5px solid rgba(255,255,255,0.85)", opacity: p,
      boxShadow: "0 0 34px rgba(255,255,255,0.28), 0 24px 60px rgba(0,0,0,0.45)",
      pointerEvents: "none",
    }} />
  </>;
};

type PhoneBubbleProps = {
  anchor: { x: number; y: number };
  visibleFrom: number;
  visibleTo: number;
  leaderWindow?: { from: number; to: number };
  children: React.ReactNode;
};

// ── 手機拉出面板（L 形虛線拉線＋磨砂玻璃卡片）─────────────────
export const PhoneBubble: React.FC<PhoneBubbleProps> = ({ anchor, visibleFrom, visibleTo, leaderWindow, children }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [visibleFrom, visibleFrom + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [visibleTo - 12, visibleTo], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);
  const leaderIn = leaderWindow
    ? interpolate(frame, [leaderWindow.from, leaderWindow.from + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const leaderOut = leaderWindow
    ? interpolate(frame, [leaderWindow.to - 12, leaderWindow.to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const leaderOpacity = Math.min(leaderIn, leaderOut);
  if (opacity <= 0.001) return null;
  const panel = { left: 1180, top: 90, width: 600, height: 900, radius: 34 };
  const leaderPoints = `${anchor.x},${anchor.y + 45} ${anchor.x},930 ${panel.left - 6},930`;
  return <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
    <svg style={{ position: "absolute", inset: 0, opacity: leaderOpacity }} width={1920} height={1080}>
      <polyline points={leaderPoints} fill="none" stroke="#fff" strokeWidth={3.5} strokeDasharray="10 7" />
    </svg>
    <div style={{
      position: "absolute", left: panel.left, top: panel.top, width: panel.width, height: panel.height,
      boxSizing: "border-box", borderRadius: panel.radius, overflow: "hidden",
      clipPath: `inset(0 round ${panel.radius}px)`, background: "rgba(208,212,218,0.62)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      boxShadow: "0 30px 90px rgba(3,8,18,0.48), 0 8px 30px rgba(3,8,18,0.24)",
    }}>
      <div style={{
        position: "absolute", left: 14, top: 14, zIndex: 1,
        background: "rgba(15,18,25,0.86)", borderLeft: "4px solid #ff8a3d", borderRadius: 9,
        padding: "10px 18px", color: "#fff", fontFamily: FONT, fontSize: 20, fontWeight: 700,
        letterSpacing: 1.5, boxShadow: "0 8px 24px rgba(0,0,0,0.32)",
      }}>手機操作畫面</div>
      {children}
    </div>
  </div>;
};

// ── PO 手部素材持機框（hand.png 3x 挖空版：螢幕區透空、指尖壓螢幕保留）──
// 素材量測（原 345px，×3 部署）：機身 slab (66,20)-(185,287)；挖空螢幕區×3 = (207,72) 339×774
export const PhoneAssetFrame: React.FC<{
  src: string; enterFrame: number; left: number; top: number;
  overlay?: React.ReactNode; children: React.ReactNode;
}> = ({ src, enterFrame, left, top, overlay, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  const SIZE = 1035;
  const SCREEN = { left: 207, top: 72, width: 339, height: 774 }; // 挖空區（素材座標）
  const k = SCREEN.width / 390; // 內容 390×844 均勻縮放，垂直置中留黑
  const contentTop = SCREEN.top + (SCREEN.height - 844 * k) / 2;
  return (
    <div style={{
      position: "absolute", left, top, width: SIZE, height: SIZE,
      transform: `translateY(${interpolate(p, [0, 1], [120, 0])}px)`, opacity: p,
    }}>
      <div style={{ position: "absolute", left: SCREEN.left, top: SCREEN.top, width: SCREEN.width, height: SCREEN.height, background: "#000", borderRadius: 18 }} />
      <div style={{
        position: "absolute", left: SCREEN.left, top: contentTop, width: 390, height: 844,
        transform: `scale(${k})`, transformOrigin: "top left", overflow: "hidden", borderRadius: 14, background: "#111",
      }}>
        {children}
      </div>
      <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: SIZE, height: SIZE, maxWidth: "none" }} />
      {overlay}
    </div>
  );
};

// ── 小標字卡（左側深底橘邊；title 可省）─────────────────────────
export const InfoCard: React.FC<{ at: number; title?: string; body: string }> = ({ at, title, body }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at - 8, at + 6], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "absolute", left: 72, top: 300, width: 650, opacity, fontFamily: FONT,
      background: "rgba(15,18,25,0.86)", borderLeft: "6px solid #ff8a3d", borderRadius: 10,
      padding: "22px 28px", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
      {title && <div style={{ color: "#ffad73", fontSize: 22, fontWeight: 800, letterSpacing: 4 }}>{title}</div>}
      <div style={{ color: "#fff", fontSize: 30, fontWeight: 650, marginTop: title ? 10 : 0, lineHeight: 1.6 }}>{body}</div>
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
export const PhoneFrame: React.FC<{ enterFrame: number; x?: number; y?: number; scale?: number; hand?: string; overlay?: React.ReactNode; children: React.ReactNode }> = ({ enterFrame, x = 0, y = 0, scale = 1.06, hand, overlay, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  const W = 400, H = 866; // 螢幕 390×844 + 邊框
  return (
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + interpolate(p, [0, 1], [420, 0])}px)) scale(${scale})`,
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
        pointerEvents: "none",
        transform: `scale(${press})`, transformOrigin: `${tip[0] * scale}px ${tip[1] * scale}px`,
        filter: "drop-shadow(-6px 10px 14px rgba(0,0,0,0.35))",
      }} />
    </>
  );
};

const QrFrame: React.FC<{ qr: QrGeometry; frameSize: number }> = ({ qr, frameSize }) => (
  <div style={{
    position: "absolute", left: `${(qr.x - frameSize / 2) / 4.8}%`,
    top: `${(qr.y - frameSize / 2) / 10.4}%`, width: `${frameSize / 4.8}%`,
    height: `${frameSize / 10.4}%`,
  }}>
    {([[0, 0], [1, 0], [0, 1], [1, 1]] as const).map(([right, bottom]) => (
      <div key={`${right}-${bottom}`} style={{
        position: "absolute", width: "28%", height: "28%",
        left: right ? undefined : 0, right: right ? 0 : undefined,
        top: bottom ? undefined : 0, bottom: bottom ? 0 : undefined,
        borderTop: bottom ? undefined : "5px solid rgba(255,255,255,0.95)",
        borderBottom: bottom ? "5px solid rgba(255,255,255,0.95)" : undefined,
        borderLeft: right ? undefined : "5px solid rgba(255,255,255,0.95)",
        borderRight: right ? "5px solid rgba(255,255,255,0.95)" : undefined,
        boxSizing: "border-box",
      }} />
    ))}
  </div>
);

// ── 掃描視圖（相機畫面：背景＋QR＋掃描線）───────────────────────
// chrome=false：素材已自帶相機 chip／取景框（如 PO 設計稿）→ 只疊掃描線與完成標語
export const ScanView: React.FC<{
  bg: string; from: number; to: number; qr: QrGeometry;
  scanLabel?: string; doneLabel?: string; chrome?: boolean;
}> = ({ bg, from, to, qr, scanLabel = "相機・對準展板 QR", doneLabel = "✓ 已辨識・開啟導覽功能", chrome = true }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const frameSize = qr.size * 1.3;
  const scanY = qr.y - frameSize / 2 + frameSize * (0.5 - 0.5 * Math.cos(t * Math.PI * 4));
  const locked = t > 0.82;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Img src={staticFile(bg)} style={{
        position: "absolute", width: "100%", height: "100%", objectFit: "cover",
        filter: chrome ? "brightness(0.9)" : undefined,
      }} />
      {chrome && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />}
      {chrome && (
        <div style={{ position: "absolute", top: 28, left: 0, width: "100%", color: "#fff", textAlign: "center", fontFamily: FONT, fontSize: 17, fontWeight: 700, letterSpacing: 2 }}>
          <span style={{ background: "rgba(0,0,0,0.62)", padding: "7px 12px", borderRadius: 16 }}>{scanLabel}</span>
        </div>
      )}
      {chrome && <QrFrame qr={qr} frameSize={frameSize} />}
      {/* 掃描線 */}
      {!locked && <div style={{ position: "absolute", left: `${(qr.x - frameSize / 2) / 4.8}%`, top: `${scanY / 10.4}%`, width: `${frameSize / 4.8}%`, height: 3, background: "linear-gradient(90deg, transparent, #35d07f, transparent)" }} />}
      {locked && (
        <div style={{ position: "absolute", left: "50%", top: "62%", transform: "translateX(-50%)", whiteSpace: "nowrap", color: "#35d07f", fontFamily: FONT, fontSize: 20, fontWeight: 700, background: "rgba(0,0,0,0.55)", padding: "6px 16px", borderRadius: 20 }}>
          {doneLabel}
        </div>
      )}
    </div>
  );
};

export const EndCard: React.FC<{ feature: string; index: number; fade: number; isFinal?: boolean }> = ({ feature, fade, isFinal = false }) => {
  if (fade <= 0.6) return null;
  const opacity = (fade - 0.6) / 0.4;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity, fontFamily: FONT }}>
      <div style={{ color: "#e8ecf2", textAlign: "center" }}>
        <div style={{ color: "#ffad73", fontSize: 17, fontWeight: 800, letterSpacing: 4 }}>{isFinal ? "組立工場行動導覽" : "導覽功能"}</div>
        <div style={{ fontSize: 34, letterSpacing: 4, fontWeight: 600, marginTop: 12 }}>{feature}</div>
      </div>
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
