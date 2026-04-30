import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, AbsoluteFill } from "remotion";

// Seeded pseudo-random for stable sparks
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

const CHUCK_CX = 200;
const CHUCK_CY = 300;
const CHUCK_RX = 90;
const CHUCK_RY = 32; // ~1:0.35 ratio

// Cylinder end caps
const LEFT_CAP = { cx: 280, cy: 300, rx: 32, ry: 11 };
const RIGHT_CAP_BASE = { cx: 680, cy: 300, rx: 26, ry: 9 };

// Tool start / end X positions (moves left)
const TOOL_START_X = 750;
const TOOL_END_X = 420;

export const LatheScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Rotation angle (degrees) — continuous after frame 20
  const rotDeg = frame > 20 ? (frame - 20) * (360 / 30) : 0; // one full rotation per 30 frames

  // Tool X position
  const toolX = interpolate(frame, [30, 120], [TOOL_START_X, TOOL_END_X], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Contact point (where tool tip meets workpiece surface)
  const contactX = toolX - 8;
  const contactY = 287; // top of cylinder

  // Spark visibility
  const sparksVisible = frame >= 60 && toolX < TOOL_START_X - 10;
  // Chips visibility
  const chipsVisible = frame >= 80;

  // Animate right end cap X (moves left as material is removed)
  const rightCapX = interpolate(frame, [30, 120], [RIGHT_CAP_BASE.cx, RIGHT_CAP_BASE.cx - 60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rightCap = { ...RIGHT_CAP_BASE, cx: rightCapX };

  // Chuck jaw trapezoid angles (3 jaws, 120° apart)
  const jawAngles = [0, 120, 240].map((a) => a + rotDeg);

  return (
    <AbsoluteFill style={{ background: "#1a1a2e", opacity }}>
    <svg width="1280" height="600" viewBox="0 0 1280 600" style={{ width: "100%", height: "100%" }}>
      <defs>
        {/* Cylinder lateral gradient */}
        <linearGradient id="cylGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5bb8ff" />
          <stop offset="50%" stopColor="#3a8ad4" />
          <stop offset="100%" stopColor="#1a4a7a" />
        </linearGradient>

        {/* Chuck face radial gradient */}
        <radialGradient id="chuckGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#888" />
          <stop offset="100%" stopColor="#333" />
        </radialGradient>

        {/* Lathe bed gradient */}
        <linearGradient id="bedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a4a5a" />
          <stop offset="100%" stopColor="#2a2a3a" />
        </linearGradient>

        {/* Right cap shadow */}
        <radialGradient id="rightCapGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2a6aaa" />
          <stop offset="100%" stopColor="#0d2844" />
        </radialGradient>
      </defs>

      {/* ── Lathe bed (3/4 perspective trapezoid) ── */}
      <g opacity={0.9}>
        {/* Main bed body */}
        <polygon
          points="80,380 1200,380 1180,480 100,480"
          fill="url(#bedGrad)"
          stroke="#555"
          strokeWidth={1}
        />
        {/* Top surface highlight */}
        <polygon points="80,380 1200,380 1185,395 95,395" fill="#5a5a6a" />
        {/* Guide rails */}
        <rect x={95} y={385} width={1090} height={8} rx={3} fill="#666" stroke="#777" strokeWidth={0.5} />
        <rect x={95} y={400} width={1090} height={8} rx={3} fill="#555" stroke="#666" strokeWidth={0.5} />
      </g>

      {/* ── Headstock housing ── */}
      <rect x={80} y={200} width={160} height={185} rx={8} fill="#3a3a4a" stroke="#555" strokeWidth={1.5} />
      <rect x={88} y={208} width={144} height={30} rx={4} fill="#4a4a5a" />

      {/* ── Chuck body (ellipse, perspective) ── */}
      <g>
        {/* Chuck depth/side */}
        <ellipse cx={CHUCK_CX} cy={CHUCK_CY} rx={CHUCK_RX} ry={CHUCK_RY} fill="#222" />
        {/* Chuck offset body */}
        <rect
          x={CHUCK_CX - CHUCK_RX}
          y={CHUCK_CY - CHUCK_RY - 25}
          width={CHUCK_RX * 2}
          height={30}
          fill="#2a2a2a"
        />
        {/* Chuck face */}
        <ellipse
          cx={CHUCK_CX}
          cy={CHUCK_CY - 25}
          rx={CHUCK_RX}
          ry={CHUCK_RY}
          fill="url(#chuckGrad)"
          stroke="#666"
          strokeWidth={1.5}
        />
        {/* Chuck inner ring */}
        <ellipse
          cx={CHUCK_CX}
          cy={CHUCK_CY - 25}
          rx={CHUCK_RX * 0.55}
          ry={CHUCK_RY * 0.55}
          fill="none"
          stroke="#555"
          strokeWidth={2}
        />
        {/* Chuck center hole */}
        <ellipse
          cx={CHUCK_CX}
          cy={CHUCK_CY - 25}
          rx={CHUCK_RX * 0.18}
          ry={CHUCK_RY * 0.18}
          fill="#111"
          stroke="#444"
          strokeWidth={1}
        />

        {/* Jaws (3 trapezoids, rotating) */}
        {jawAngles.map((angleDeg, i) => {
          const rad = (angleDeg * Math.PI) / 180;
          const jawR = CHUCK_RX * 0.78;
          // Perspective: x uses rx, y uses ry
          const jawCX = CHUCK_CX + jawR * Math.cos(rad);
          const jawCY = (CHUCK_CY - 25) + CHUCK_RY * 0.78 * Math.sin(rad);
          const perpRad = rad + Math.PI / 2;
          const hw = 10; // half-width
          const len = 18;
          // Trapezoid: 4 points
          const p1x = jawCX + hw * Math.cos(perpRad);
          const p1y = jawCY + hw * Math.sin(perpRad) * (CHUCK_RY / CHUCK_RX);
          const p2x = jawCX - hw * Math.cos(perpRad);
          const p2y = jawCY - hw * Math.sin(perpRad) * (CHUCK_RY / CHUCK_RX);
          const inward = { x: Math.cos(rad + Math.PI), y: Math.sin(rad + Math.PI) * (CHUCK_RY / CHUCK_RX) };
          const p3x = p2x + len * inward.x;
          const p3y = p2y + len * inward.y;
          const p4x = p1x + len * inward.x;
          const p4y = p1y + len * inward.y;
          return (
            <polygon
              key={i}
              points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`}
              fill="#c0392b"
              stroke="#e74c3c"
              strokeWidth={1}
            />
          );
        })}
      </g>

      {/* ── Workpiece cylinder ── */}
      <g>
        {/* Cylinder body: rect between two end cap X positions, with gradient */}
        <rect
          x={LEFT_CAP.cx}
          y={CHUCK_CY - 25 - LEFT_CAP.ry}
          width={rightCap.cx - LEFT_CAP.cx}
          height={LEFT_CAP.ry * 2}
          fill="url(#cylGrad)"
        />

        {/* Right end cap (darker, smaller — depth simulation) */}
        <ellipse
          cx={rightCap.cx}
          cy={CHUCK_CY - 25}
          rx={rightCap.rx}
          ry={rightCap.ry}
          fill="url(#rightCapGrad)"
          stroke="#1a6a9a"
          strokeWidth={1}
        />

        {/* Left end cap (brighter — near chuck) */}
        <ellipse
          cx={LEFT_CAP.cx}
          cy={CHUCK_CY - 25}
          rx={LEFT_CAP.rx}
          ry={LEFT_CAP.ry}
          fill="#5bb8ff"
          stroke="#7accff"
          strokeWidth={1}
        />

        {/* Spinning lines on workpiece to simulate rotation */}
        {[0, 45, 90, 135].map((baseDeg, i) => {
          const a = ((baseDeg + rotDeg) % 180) * (Math.PI / 180);
          // Project rotation line as horizontal stripe
          const yOff = LEFT_CAP.ry * 0.8 * Math.sin(a);
          return (
            <line
              key={i}
              x1={LEFT_CAP.cx}
              y1={CHUCK_CY - 25 + yOff}
              x2={rightCap.cx}
              y2={CHUCK_CY - 25 + yOff}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
          );
        })}
      </g>

      {/* ── Tool post / carriage ── */}
      <g transform={`translate(${toolX - 60}, 330)`}>
        {/* Carriage block */}
        <rect x={0} y={0} width={80} height={50} rx={4} fill="#444" stroke="#666" strokeWidth={1} />
        <rect x={5} y={5} width={70} height={15} rx={2} fill="#555" />
        {/* Tool holder */}
        <rect x={50} y={-30} width={22} height={35} rx={2} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
        {/* Tool bit — angled cutting tool */}
        <polygon
          points="68,-30 72,-30 80,-45 70,-48 62,-32"
          fill="#b8860b"
          stroke="#ffd700"
          strokeWidth={1}
        />
      </g>

      {/* ── Sparks ── */}
      {sparksVisible &&
        Array.from({ length: 18 }).map((_, i) => {
          const t = ((frame - 60) / 60 + seededRand(i * 7) * 0.5) % 1;
          const angle = seededRand(i * 3) * Math.PI - Math.PI / 2;
          const speed = 40 + seededRand(i * 5) * 60;
          const sx = contactX + Math.cos(angle) * speed * t;
          const sy = contactY + Math.sin(angle) * speed * t + 30 * t * t; // gravity arc
          const sparkOpacity = 1 - t;
          const color = seededRand(i) > 0.5 ? "#ffcc00" : "#ff8800";
          return (
            <circle
              key={i}
              cx={sx}
              cy={sy}
              r={2 + seededRand(i * 11) * 2}
              fill={color}
              opacity={sparkOpacity}
            />
          );
        })}

      {/* ── Chips (curling path) ── */}
      {chipsVisible &&
        Array.from({ length: 5 }).map((_, i) => {
          const t = Math.min((frame - 80) / 40, 1);
          const chipProgress = Math.min(t * (1 + seededRand(i) * 0.5), 1);
          const baseX = contactX - i * 3;
          const baseY = contactY;
          // Curling upward bezier
          const cx1 = baseX - 15 - i * 5;
          const cy1 = baseY - 20 - seededRand(i * 2) * 15;
          const cx2 = baseX - 30 - i * 5;
          const cy2 = baseY - 5 + seededRand(i * 3) * 10;
          const ex = baseX - 45 - i * 6;
          const ey = baseY + 10 + seededRand(i * 4) * 8;
          const chipLen = chipProgress;
          return (
            <path
              key={i}
              d={`M ${baseX} ${baseY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}`}
              fill="none"
              stroke="#c0a060"
              strokeWidth={2.5}
              strokeDasharray="80"
              strokeDashoffset={80 * (1 - chipLen)}
              opacity={0.85}
            />
          );
        })}

      {/* ── Labels with leader lines ── */}
      <LabelWithLine
        lx={CHUCK_CX - 20}
        ly={CHUCK_CY - 70}
        tx={CHUCK_CX - 80}
        ty={CHUCK_CY - 110}
        text="轉盤"
      />
      <LabelWithLine
        lx={CHUCK_CX + 40}
        ly={CHUCK_CY - 20}
        tx={CHUCK_CX + 60}
        ty={CHUCK_CY - 90}
        text="夾具"
      />
      <LabelWithLine
        lx={(LEFT_CAP.cx + rightCap.cx) / 2}
        ly={CHUCK_CY - 45}
        tx={(LEFT_CAP.cx + rightCap.cx) / 2 + 20}
        ty={CHUCK_CY - 120}
        text="工作件"
      />
      <LabelWithLine
        lx={toolX + 10}
        ly={320}
        tx={toolX + 60}
        ty={250}
        text="車刀"
      />

      {/* Title */}
      <text x={640} y={545} textAnchor="middle" fill="#aaa" fontSize={18} fontFamily="sans-serif">
        車床加工模擬
      </text>
    </svg>
    </AbsoluteFill>
  );
};

interface LabelProps {
  lx: number; ly: number;
  tx: number; ty: number;
  text: string;
}

const LabelWithLine: React.FC<LabelProps> = ({ lx, ly, tx, ty, text }) => (
  <g>
    <line x1={lx} y1={ly} x2={tx} y2={ty} stroke="#aaa" strokeWidth={1} strokeDasharray="4,3" />
    <circle cx={lx} cy={ly} r={3} fill="#aaa" />
    <rect x={tx - 26} y={ty - 16} width={52} height={20} rx={4} fill="rgba(0,0,0,0.6)" />
    <text
      x={tx}
      y={ty - 2}
      textAnchor="middle"
      fill="#e0e0e0"
      fontSize={13}
      fontFamily="sans-serif"
      fontWeight="600"
    >
      {text}
    </text>
  </g>
);
