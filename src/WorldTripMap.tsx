import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  Easing,
  staticFile,
} from "remotion";

const MAP_W = 2754;
const MAP_H = 1398;

const project = (lon: number, lat: number) => ({
  x: ((lon + 180) / 360) * MAP_W,
  y: ((90 - lat) / 180) * MAP_H,
});

const LA = project(-118.25, 34.05);
const NY = project(-74.0, 40.71);
const PA = project(2.35, 48.85);

// Great-circle arc control points (bow northward)
const C1 = { x: (LA.x + NY.x) / 2, y: Math.min(LA.y, NY.y) - 100 };
const C2 = { x: (NY.x + PA.x) / 2, y: Math.min(NY.y, PA.y) - 240 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const qb = (
  ax: number, ay: number,
  cx: number, cy: number,
  bx: number, by: number,
  t: number
) => {
  const s = 1 - t;
  return { x: s * s * ax + 2 * s * t * cx + t * t * bx, y: s * s * ay + 2 * s * t * cy + t * t * by };
};

interface Cam { cx: number; cy: number; s: number }

function getCam(frame: number, laProg: number, nyProg: number): Cam {
  const ec = Easing.inOut(Easing.cubic);
  if (frame < 90) {
    const t = ec(frame / 90);
    return { cx: lerp(LA.x, MAP_W / 2, t), cy: lerp(LA.y, MAP_H / 2 - 50, t), s: lerp(3.0, 0.46, t) };
  }
  if (frame < 120) return { cx: MAP_W / 2, cy: MAP_H / 2 - 50, s: 0.46 };
  if (frame < 240) {
    const tip = qb(LA.x, LA.y, C1.x, C1.y, NY.x, NY.y, laProg);
    return { cx: tip.x, cy: tip.y, s: 1.1 };
  }
  if (frame < 300) {
    const t = ec((frame - 240) / 60);
    return { cx: NY.x, cy: NY.y, s: lerp(1.1, 1.4, t) };
  }
  if (frame < 420) {
    const tip = qb(NY.x, NY.y, C2.x, C2.y, PA.x, PA.y, nyProg);
    return { cx: tip.x, cy: tip.y, s: 0.85 };
  }
  if (frame < 490) {
    const t = ec((frame - 420) / 70);
    return { cx: PA.x, cy: PA.y, s: lerp(0.85, 5.0, t) };
  }
  return { cx: PA.x, cy: PA.y - 10, s: 5.0 };
}

// Red pin-style city marker
const CityDot: React.FC<{
  x: number; y: number; r: number; pulse: number;
}> = ({ x, y, r, pulse }) => (
  <g>
    <circle cx={x} cy={y} r={r * pulse * 2.4} fill="rgba(220,55,55,0.18)" />
    <circle cx={x} cy={y} r={r * 1.1} fill="#e84848" stroke="white" strokeWidth={r * 0.28} />
    <circle cx={x} cy={y} r={r * 0.38} fill="rgba(255,255,255,0.75)" />
  </g>
);

// Eiffel Tower (dark iron colors for light background)
const EiffelTower: React.FC<{ frame: number }> = ({ frame }) => {
  const prog = interpolate(frame, [495, 545], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });
  if (prog <= 0) return null;

  const cx = PA.x;
  const base = PA.y + 6;
  const h = 50, bw = 8;
  const p1y = base - h * 0.35;
  const p2y = base - h * 0.65;
  const top = base - h;
  const ant = top - 5;
  const dx = 3, dy = 1.2;

  const f = (pts: [number, number][]) =>
    pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const front: [number, number][] = [
    [cx - bw, base], [cx - bw * 0.44, p1y], [cx - bw * 0.20, p2y],
    [cx - 0.3, top], [cx + 0.3, top], [cx + bw * 0.54, p1y], [cx + bw * 0.67, base],
  ];
  const rightSide: [number, number][] = [
    [cx + bw * 0.67, base], [cx + bw * 0.54, p1y], [cx + bw * 0.20, p2y],
    [cx + 0.3, top], [cx + 0.3 + dx, top + dy], [cx + bw * 0.20 + dx, p2y + dy],
    [cx + bw * 0.54 + dx, p1y + dy], [cx + bw * 0.67 + dx, base + dy],
  ];
  const leftHighlight: [number, number][] = [
    [cx - bw, base], [cx - bw * 0.44, p1y], [cx - bw * 0.20, p2y],
    [cx - 0.3, top], [cx + 0.2, top], [cx, base],
  ];

  const beacon = 0.6 + 0.4 * Math.sin(frame * 0.45);

  return (
    <g transform={`translate(${cx},${base}) scale(1,${prog}) translate(${-cx},${-base})`} opacity={prog}>
      {/* Ground shadow */}
      <ellipse cx={cx + dx * 0.4} cy={base + 1.5} rx={bw * 0.9} ry={1.8} fill="rgba(0,0,0,0.18)" />

      {/* Right depth face */}
      <polygon points={f(rightSide)} fill="#2e1c04" />

      {/* Front face */}
      <polygon points={f(front)} fill="#5a3c10" />

      {/* Left highlight */}
      <polygon points={f(leftHighlight)} fill="#7a5520" opacity={0.55} />

      {/* Cross-bracing */}
      <line x1={cx - bw} y1={base} x2={cx + bw * 0.54} y2={p1y} stroke="#1c1004" strokeWidth={0.25} />
      <line x1={cx - bw * 0.44} y1={p1y} x2={cx + bw * 0.67} y2={base} stroke="#1c1004" strokeWidth={0.25} />
      <line x1={cx - bw * 0.44} y1={p1y} x2={cx + bw * 0.54} y2={p2y} stroke="#1c1004" strokeWidth={0.20} />
      <line x1={cx - bw * 0.20} y1={p2y} x2={cx + bw * 0.54} y2={p1y} stroke="#1c1004" strokeWidth={0.20} />

      {/* Arches */}
      <path d={`M ${cx - bw},${base} Q ${cx - bw * 0.7},${base - h * 0.15} ${cx - bw * 0.44},${p1y}`}
        fill="none" stroke="#1c1004" strokeWidth={0.22} />
      <path d={`M ${cx + bw * 0.67},${base} Q ${cx + bw * 0.6},${base - h * 0.15} ${cx + bw * 0.54},${p1y}`}
        fill="none" stroke="#1c1004" strokeWidth={0.22} />

      {/* Platforms */}
      <rect x={cx - bw * 0.5} y={p1y - 0.45} width={bw * 1.17} height={0.9} rx={0.2} fill="#7a5020" />
      <rect x={cx - bw * 0.24} y={p2y - 0.35} width={bw * 0.78} height={0.7} rx={0.2} fill="#7a5020" />

      {/* Upper shaft */}
      <rect x={cx - 0.45} y={p2y} width={1.2} height={-(h * 0.35)} fill="#4a2e08" />

      {/* Antenna */}
      <line x1={cx + 0.1} y1={top} x2={cx + 0.1} y2={ant} stroke="#5a3c10" strokeWidth={0.35} />

      {/* Beacon */}
      <circle cx={cx + 0.1} cy={ant} r={0.7} fill="#ffdd44" opacity={beacon} />
      <circle cx={cx + 0.1} cy={ant} r={1.6} fill="none" stroke="rgba(255,220,60,0.5)" strokeWidth={0.45} />
      <circle cx={cx + 0.1} cy={ant} r={3.0} fill="none" stroke="rgba(255,200,40,0.2)" strokeWidth={0.35} />
    </g>
  );
};

export const WorldTripMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();

  const laProg = interpolate(frame, [120, 240], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const nyProg = interpolate(frame, [300, 420], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const cam = getCam(frame, laProg, nyProg);
  const tx = W / 2 - cam.cx * cam.s;
  const ty = H / 2 - cam.cy * cam.s;

  const laTip = qb(LA.x, LA.y, C1.x, C1.y, NY.x, NY.y, laProg);
  const nyTip = qb(NY.x, NY.y, C2.x, C2.y, PA.x, PA.y, nyProg);

  const lw   = 3.5 / cam.s;
  const dr   = 5.5 / cam.s;
  const fs   = 9.0 / cam.s;
  const off  = 7.0 / cam.s;
  const gBlur = 3.0 / cam.s;

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const laLbl  = interpolate(frame, [10, 35],   [0, 1], { extrapolateRight: "clamp" });
  const nyLbl  = interpolate(frame, [220, 245],  [0, 1], { extrapolateRight: "clamp" });
  const paLbl  = interpolate(frame, [405, 430],  [0, 1], { extrapolateRight: "clamp" });
  const pulse  = 1.0 + 0.25 * Math.sin(frame * 0.22);

  // feColorMatrix: white(ocean,v=1)→#96c8e8, gray(land,v=0.753)→#e8d4a0
  // R: slope=-1.303, intercept=1.891
  // G: slope=-0.190, intercept=0.974
  // B: slope=+1.142, intercept=-0.233
  const colorMatrix = "-1.303 0 0 0 1.891  0 -0.190 0 0 0.974  0 0 1.142 0 -0.233  0 0 0 1 0";

  return (
    <AbsoluteFill style={{ background: "#96c8e8", opacity: fadeIn }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          {/* Watercolor map: subtle displacement + color remap */}
          <filter id="mapFilter" x="-1%" y="-1%" width="102%" height="102%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency="0.012" numOctaves="3" seed="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5"
              xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feColorMatrix type="matrix" in="displaced" values={colorMatrix} />
          </filter>

          {/* Glow for city dots and line tip */}
          <filter id="dotGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation={gBlur * 1.6} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Soft glow for route line */}
          <filter id="lineGlow" x="-30%" y="-200%" width="160%" height="500%">
            <feGaussianBlur stdDeviation={gBlur * 0.65} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Edge vignette */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(10,40,90,0.38)" />
          </radialGradient>
        </defs>

        <g transform={`translate(${tx},${ty}) scale(${cam.s})`}>
          {/* World map */}
          <image
            href={staticFile("BlankMap-World.svg")}
            x={0} y={0} width={MAP_W} height={MAP_H}
            filter="url(#mapFilter)"
          />

          {/* Lat/lon grid */}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <line key={`lat${lat}`}
              x1={0} y1={((90 - lat) / 180) * MAP_H}
              x2={MAP_W} y2={((90 - lat) / 180) * MAP_H}
              stroke="rgba(30,80,160,0.09)" strokeWidth={1.5 / cam.s}
            />
          ))}
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => (
            <line key={`lon${lon}`}
              x1={((lon + 180) / 360) * MAP_W} y1={0}
              x2={((lon + 180) / 360) * MAP_W} y2={MAP_H}
              stroke="rgba(30,80,160,0.09)" strokeWidth={1.5 / cam.s}
            />
          ))}

          {/* Ghost path (dashed, low opacity) */}
          <path
            d={`M ${LA.x},${LA.y} Q ${C1.x},${C1.y} ${NY.x},${NY.y}`}
            fill="none" stroke="rgba(210,55,55,0.16)" strokeWidth={lw * 1.4}
            strokeDasharray={`${8 / cam.s},${6 / cam.s}`} strokeLinecap="round"
          />
          <path
            d={`M ${NY.x},${NY.y} Q ${C2.x},${C2.y} ${PA.x},${PA.y}`}
            fill="none" stroke="rgba(210,55,55,0.16)" strokeWidth={lw * 1.4}
            strokeDasharray={`${8 / cam.s},${6 / cam.s}`} strokeLinecap="round"
          />

          {/* Animated route: LA → NY */}
          <path
            d={`M ${LA.x},${LA.y} Q ${C1.x},${C1.y} ${NY.x},${NY.y}`}
            fill="none"
            stroke="#e84848"
            strokeWidth={lw}
            strokeDasharray={700}
            strokeDashoffset={700 * (1 - laProg)}
            strokeLinecap="round"
            filter="url(#lineGlow)"
          />

          {/* Animated route: NY → Paris */}
          <path
            d={`M ${NY.x},${NY.y} Q ${C2.x},${C2.y} ${PA.x},${PA.y}`}
            fill="none"
            stroke="#e84848"
            strokeWidth={lw}
            strokeDasharray={1000}
            strokeDashoffset={1000 * (1 - nyProg)}
            strokeLinecap="round"
            filter="url(#lineGlow)"
          />

          {/* Moving line-tip glow */}
          {laProg > 0.01 && laProg < 0.99 && (
            <circle cx={laTip.x} cy={laTip.y} r={dr * 1.2} fill="#ff5858" filter="url(#dotGlow)" />
          )}
          {nyProg > 0.01 && nyProg < 0.99 && (
            <circle cx={nyTip.x} cy={nyTip.y} r={dr * 1.2} fill="#ff5858" filter="url(#dotGlow)" />
          )}

          {/* City markers */}
          <CityDot x={LA.x} y={LA.y} r={dr} pulse={pulse} />
          {laProg >= 0.92 && <CityDot x={NY.x} y={NY.y} r={dr} pulse={pulse} />}
          {nyProg >= 0.92 && <CityDot x={PA.x} y={PA.y} r={dr} pulse={pulse} />}

          {/* City labels */}
          <text
            x={LA.x + off} y={LA.y - off * 0.8}
            fill="#1a2a50" fontSize={fs}
            fontFamily="Helvetica Neue, Arial, sans-serif" fontWeight="700"
            stroke="rgba(255,255,255,0.78)" strokeWidth={fs * 0.18}
            paintOrder="stroke" opacity={laLbl}
          >
            Los Angeles
          </text>
          <text
            x={NY.x + off} y={NY.y - off * 0.8}
            fill="#1a2a50" fontSize={fs}
            fontFamily="Helvetica Neue, Arial, sans-serif" fontWeight="700"
            stroke="rgba(255,255,255,0.78)" strokeWidth={fs * 0.18}
            paintOrder="stroke" opacity={nyLbl}
          >
            New York
          </text>
          <text
            x={PA.x + off} y={PA.y - off * 0.8}
            fill="#1a2a50" fontSize={fs}
            fontFamily="Helvetica Neue, Arial, sans-serif" fontWeight="700"
            stroke="rgba(255,255,255,0.78)" strokeWidth={fs * 0.18}
            paintOrder="stroke" opacity={paLbl}
          >
            Paris
          </text>

          {/* Eiffel Tower */}
          <EiffelTower frame={frame} />
        </g>

        {/* Vignette overlay */}
        <rect x={0} y={0} width={W} height={H} fill="url(#vignette)" />

        {/* Bottom HUD */}
        <text
          x={W / 2} y={H - 20}
          textAnchor="middle"
          fill="rgba(20,55,130,0.55)" fontSize={13}
          fontFamily="Helvetica Neue, Arial, sans-serif" letterSpacing={5}
        >
          LOS ANGELES  ·  NEW YORK  ·  PARIS
        </text>
      </svg>
    </AbsoluteFill>
  );
};
