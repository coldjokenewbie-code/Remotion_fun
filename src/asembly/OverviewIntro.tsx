import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FingerTap, FONT, PhoneFrame, TapCursor, TitleCard } from "./shared";

const OVERVIEW = (name: string) => `asembly/overview/${name}`;
const AIR = (name: string) => `asembly/airraid/${name}`;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const 軌 = (開始: number, 結束: number, 說明: string) => z.object({
  開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
  結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
}).default({ 開始, 結束 });
const 卡片 = z.object({ 標題: z.string(), 副標: z.string() });

export const overviewIntroSchema = z.object({
  時間軸: z.object({
    標題段: 軌(0, 60, "p2 實景與首頁需求分流字卡"),
    服務台段: 軌(60, 150, "服務台實景與首頁手機"),
    快速總覽: 軌(150, 420, "四支首頁手機依序亮相停靠"),
    多語介紹: 軌(420, 560, "自動英文與手動日文切換"),
    情境手機: 軌(560, 920, "四個使用情境的連續手機軌"),
    情境一找休息: 軌(560, 620, "地圖與休息區"),
    情境二下一站: 軌(620, 680, "下一站推薦"),
    情境三展演提醒: 軌(680, 740, "展演提醒"),
    情境四搜尋: 軌(740, 920, "搜尋實錄與右側輸入框連動"),
    黑幕淡出: 軌(920, 950, "淡黑收尾；結束幀為總長"),
  }),
  樣式: z.object({
    霧面不透明度: z.number().min(0).max(1).default(0.4),
    標示色: z.string().default("#00e5ff"),
  }),
  文案: z.object({
    標題: z.string().default("首頁即提供需求分流"),
    副標: z.string().default("搜尋＋推薦並列，常見需求立刻獲得服務"),
    服務台卡: 卡片.default({ 標題: "掃描服務台 QR code 或點選連結", 副標: "進入首頁尋找服務" }),
    首頁功能卡: z.array(卡片).length(4).default([
      { 標題: "多語", 副標: "中・英・日三語介面，語言隨手機語系自動設定" },
      { 標題: "搜尋", 副標: "關鍵字或展區地圖找展品與服務，免記編號" },
      { 標題: "服務", 副標: "需要休息、協助與其他服務，地圖標示服務地點" },
      { 標題: "場次", 副標: "當期展演時間地點，開演前主動提醒" },
    ]),
    英文語系標籤: z.string().default("手機語系：English → 介面自動切換"),
    日文語系標籤: z.string().default("也可手動切換：English → 日本語"),
    情境卡: z.array(卡片).length(4).default([
      { 標題: "找休息與服務", 副標: "地圖標示服務地點" },
      { 標題: "接下來看什麼", 副標: "組立·下一站推薦" },
      { 標題: "展演即將開始", 副標: "主動提醒" },
      { 標題: "尋找特定展項", 副標: "輸入名稱 尋找想看的展品" },
    ]),
    場景卡註: z.array(z.string()).length(3).default([
      "遊客可透過地圖標示尋找所需服務：娃娃車、輪椅、休息區",
      "推薦前往重點展項：現地機具維修展演",
      "DT668 展演即將開始，邀請前往觀賞",
    ]),
    搜尋關鍵字: z.string().default("車削"),
    搜尋結果項: z.string().default("互動機具：車削機台"),
    搜尋註: z.string().default("輸入關鍵字，點選展項查看展示介紹"),
  }),
});
export type OverviewIntroProps = z.infer<typeof overviewIntroSchema>;
export const overviewIntroDefaultProps: OverviewIntroProps = overviewIntroSchema.parse({ 時間軸: {}, 樣式: {}, 文案: {} });
type Track = { 開始: number; 結束: number };
const duration = (track: Track) => track.結束 - track.開始;
const SLOT_X = [-720, -240, 240, 720];
const RINGS = [
  [{ x: 224, y: 49, w: 112, h: 38, r: 19 }],
  [{ x: 18, y: 356, w: 354, h: 60, r: 30 }],
  [{ x: 21, y: 528, w: 115, h: 76, r: 18 }, { x: 254, y: 528, w: 115, h: 76, r: 18 }],
  [{ x: 138, y: 528, w: 115, h: 76, r: 18 }],
];

const SceneImage: React.FC<{ src: string; opacity?: number; dim?: number }> = ({ src, opacity = 1, dim = 0.24 }) => <div style={{ position: "absolute", inset: 0, opacity }}>
  <Img src={staticFile(OVERVIEW(src))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})` }} />
</div>;

const Backgrounds: React.FC<{ T: OverviewIntroProps["時間軸"] }> = ({ T }) => {
  const frame = useCurrentFrame();
  const hall = interpolate(frame, [T.情境手機.開始, T.情境手機.開始 + 12], [0, 1], clamp);
  return <>{frame < T.服務台段.開始 && <SceneImage src="p2_scene.png" />}
    {frame >= T.服務台段.開始 && <SceneImage src="counter_front.png" opacity={1 - hall} />}
    {frame >= T.情境手機.開始 && <SceneImage src="hall_next.jpg" opacity={hall} />}</>;
};

const TrackFade: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const opacity = interpolate(useCurrentFrame(), [len - 6, len], [1, 0], clamp);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

const SmallCard: React.FC<{ title: string; subtitle: string; enterFrame?: number; maxWidth?: number }> = ({ title, subtitle, enterFrame = 2, maxWidth = 900 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = enterFrame <= 0 ? 1 : spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  return <div style={{ position: "absolute", top: 56, left: 64, maxWidth, opacity: progress, transform: `translateX(${interpolate(progress, [0, 1], [-60, 0])}px)`, background: "rgba(15,18,25,.78)", backdropFilter: "blur(6px)", borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "20px 28px", fontFamily: FONT }}>
    <div style={{ color: "#fff", fontSize: 36, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
    <div style={{ color: "#d8dde6", fontSize: 22, marginTop: 6, letterSpacing: 1 }}>{subtitle}</div>
  </div>;
};

// 高對比流動標示框（PO 2026-07-22：橘框近視覺阻塞→高對比色＋閃動＋線加粗＋光暈放大＋虛線流動）
const FlowRings: React.FC<{ index: number; color: string; enterFrame?: number }> = ({ index, color, enterFrame = 6 }) => {
  const frame = useCurrentFrame();
  const alpha = interpolate(frame, [enterFrame, enterFrame + 10], [0, 1], clamp);
  const t = Math.max(0, frame - enterFrame);
  const blink = 0.5 + 0.5 * Math.sin((t / 20) * Math.PI * 2);
  const glow = 10 + 14 * blink;
  const PAD = 18;
  return <>{RINGS[index].map((ring, ringIndex) => (
    <svg key={ringIndex} width={ring.w + PAD * 2} height={ring.h + PAD * 2} style={{ position: "absolute", left: ring.x - PAD, top: ring.y - PAD, opacity: alpha, overflow: "visible", filter: `drop-shadow(0 0 ${glow}px ${color}) drop-shadow(0 0 ${glow * 1.8}px ${color})` }}>
      <rect x={PAD} y={PAD} width={ring.w} height={ring.h} rx={ring.r} fill="none" stroke={color} strokeWidth={5} strokeOpacity={0.65 + 0.35 * blink} strokeDasharray="16 10" strokeDashoffset={-t * 1.5} strokeLinecap="round" />
    </svg>
  ))}</>;
};

// 上方功能字卡（小標字級；隨手機停靠同步移動）。dip＝後進手機置中亮相時，內側停靠卡暫時退淡讓位
const FeatureTopCard: React.FC<{ title: string; subtitle: string; x: number; width: number; enterFrame?: number; dip?: number }> = ({ title, subtitle, x, width, enterFrame = 2, dip = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enterFrame <= -30 ? 1 : spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  return <div style={{ position: "absolute", top: 40, left: "50%", width, boxSizing: "border-box", opacity: p * dip, transform: `translateX(calc(-50% + ${x}px)) translateY(${(1 - p) * -40}px)`, background: "rgba(15,18,25,.86)", backdropFilter: "blur(6px)", borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "16px 24px", fontFamily: FONT }}>
    <div style={{ color: "#fff", fontSize: 36, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
    <div style={{ color: "#d8dde6", fontSize: 22, marginTop: 6, letterSpacing: 1, lineHeight: 1.5 }}>{subtitle}</div>
  </div>;
};

const FeaturePhone: React.FC<{ index: number; card: { 標題: string; 副標: string }; color: string }> = ({ index, card, color }) => {
  const frame = useCurrentFrame();
  const dock = interpolate(frame, [46, 60], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const x = interpolate(dock, [0, 1], [0, SLOT_X[index]]);
  const scale = interpolate(dock, [0, 1], [0.88, 0.62]);
  const y = interpolate(dock, [0, 1], [70, 96]);
  // 內側停靠位（±240）與後進手機的置中字卡水平重疊→後進亮相期間退淡
  const dip = index === 1 || index === 2
    ? Array.from({ length: 3 - index }, (_, j) => {
      const s = (j + 1) * 60;
      return interpolate(frame, [s + 2, s + 8, s + 52, s + 58], [1, 0.15, 0.15, 1], clamp);
    }).reduce((a, b) => Math.min(a, b), 1)
    : 1;
  return <><PhoneFrame enterFrame={2} x={x} y={y} scale={scale}>
    <Img src={staticFile(OVERVIEW("home.png"))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    <FlowRings index={index} color={color} />
  </PhoneFrame><FeatureTopCard title={card.標題} subtitle={card.副標} x={x} width={interpolate(dock, [0, 1], [640, 440])} dip={dip} /></>;
};

const DockedSnapshot: React.FC<{ cards: OverviewIntroProps["文案"]["首頁功能卡"]; color: string }> = ({ cards, color }) => {
  const opacity = interpolate(useCurrentFrame(), [0, 10], [1, 0], clamp);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{cards.map((card, index) => <React.Fragment key={card.標題}>
    <PhoneFrame enterFrame={-60} x={SLOT_X[index]} y={96} scale={0.62}>
      <Img src={staticFile(OVERVIEW("home.png"))} style={{ width: "100%", height: "100%", objectFit: "cover" }} /><FlowRings index={index} color={color} enterFrame={-60} />
    </PhoneFrame><FeatureTopCard title={card.標題} subtitle={card.副標} x={SLOT_X[index]} width={440} enterFrame={-60} />
  </React.Fragment>)}</div>;
};

const LanguageScreens: React.FC = () => {
  const frame = useCurrentFrame();
  const layer = (src: string, opacity: number) => <Img src={staticFile(OVERVIEW(src))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity }} />;
  const en = interpolate(frame, [32, 38], [0, 1], clamp);
  const jp = interpolate(frame, [100, 106], [0, 1], clamp);
  return <>{layer("home.png", 1 - en)}{layer("home_en.png", Math.min(en, 1 - jp))}{layer("home_jp.png", jp)}</>;
};

const LangChip: React.FC<{ text: string; from: number; to: number }> = ({ text, from, to }) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(interpolate(frame, [from, from + 8], [0, 1], clamp), interpolate(frame, [to - 6, to], [1, 0], clamp));
  return <div style={{ position: "absolute", left: 200, top: 245, opacity, transform: `translateY(${(1 - opacity) * 16}px)`, background: "rgba(15,18,25,.88)", color: "#ffd9bd", fontFamily: FONT, fontSize: 24, fontWeight: 700, letterSpacing: 1.5, padding: "12px 22px", borderRadius: 999, border: "1.5px solid rgba(255,138,61,.65)", boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>{text}</div>;
};

const SlidePanel: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  return <div style={{ position: "absolute", left: 1080, top: 340, width: 760, opacity: progress, transform: `translateX(${interpolate(progress, [0, 1], [560, 0])}px)`, background: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 16px 50px rgba(0,0,0,.5)" }}>
    <Img src={staticFile(OVERVIEW(src))} style={{ display: "block", width: "100%", borderRadius: 8 }} />
  </div>;
};

// 手機內容→右側場景卡 連動虛線（拉線動畫＋持續流動）
const LinkLine: React.FC<{ from: [number, number]; to: [number, number]; at: number; color: string }> = ({ from, to, at, color }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (t <= 0) return null;
  return <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none", filter: `drop-shadow(0 0 6px ${color})` }}>
    <line x1={from[0]} y1={from[1]} x2={from[0] + (to[0] - from[0]) * t} y2={from[1] + (to[1] - from[1]) * t} stroke={color} strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={-frame * 1.5} strokeLinecap="round" />
    <circle cx={from[0]} cy={from[1]} r={7} fill={color} />
    {t >= 1 && <circle cx={to[0]} cy={to[1]} r={7} fill={color} />}
  </svg>;
};

// 場景卡上方小標說明（打字機效果，連線完成後開始）
const PanelNote: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at, at + 6], [0, 1], clamp);
  if (opacity <= 0.001) return null;
  const chars = Math.floor(interpolate(frame, [at + 4, at + 4 + text.length / 1.5], [0, text.length], clamp));
  const typing = chars < text.length;
  return <div style={{ position: "absolute", left: 1080, top: 246, width: 760, boxSizing: "border-box", opacity, background: "rgba(15,18,25,.86)", borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "14px 24px", fontFamily: FONT }}>
    <div style={{ color: "#fff", fontSize: 26, fontWeight: 650, letterSpacing: 1, lineHeight: 1.55, minHeight: 40 }}>{text.slice(0, chars)}{typing && frame % 10 < 6 && <span style={{ color: "#ffad73" }}>▌</span>}</div>
  </div>;
};

// 情境四右側鏡像：關鍵字輸入框（打字機）→ 結果項浮現 → 游標點選 → 高亮
const SearchMock: React.FC<{ keyword: string; result: string; note: string; color: string }> = ({ keyword, result, note, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const typedCount = Math.floor(interpolate(frame, [44, 44 + keyword.length * 14], [0, keyword.length], clamp));
  const typing = typedCount < keyword.length;
  // 時序對齊素材影片（local：打字54-75→結果列75-114→跳轉~128）：先點選結果、後跳轉
  const resultIn = interpolate(frame, [76, 86], [0, 1], clamp);
  const tapped = frame >= 108;
  return <div style={{ position: "absolute", left: 1080, top: 300, width: 620, opacity: p, transform: `translateX(${interpolate(p, [0, 1], [560, 0])}px)`, fontFamily: FONT }}>
    <div style={{ boxSizing: "border-box", background: "rgba(15,18,25,.86)", borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 24, fontWeight: 650, letterSpacing: 1 }}>{note}</div>
    <div style={{ marginTop: 16, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 16, padding: "20px 26px", boxShadow: "0 14px 44px rgba(0,0,0,.45)" }}>
      <span style={{ fontSize: 30, lineHeight: 1 }}>🔍</span>
      <span style={{ fontSize: 38, fontWeight: 700, color: typedCount > 0 ? "#1a2233" : "#9aa3b0", letterSpacing: 2 }}>
        {typedCount > 0 ? keyword.slice(0, typedCount) : "輸入關鍵字"}{typing && frame % 10 < 6 && <span style={{ color: "#ff8a3d" }}>▌</span>}
      </span>
    </div>
    <div style={{ marginTop: 18, boxSizing: "border-box", background: "#fff", borderRadius: 14, padding: "18px 24px", opacity: resultIn, transform: `translateY(${(1 - resultIn) * 24}px)`, border: `3px solid ${tapped ? color : "transparent"}`, boxShadow: tapped ? `0 0 26px ${color}` : "0 14px 44px rgba(0,0,0,.45)" }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: "#1a2233", letterSpacing: 1 }}>{result}</div>
      <div style={{ fontSize: 20, color: "#5a6474", marginTop: 6 }}>點選查看展示介紹</div>
    </div>
  </div>;
};

const ScenarioScreens: React.FC<{ T: OverviewIntroProps["時間軸"] }> = ({ T }) => {
  const frame = useCurrentFrame();
  const bounds = [T.情境一找休息.開始, T.情境二下一站.開始, T.情境三展演提醒.開始, T.情境四搜尋.開始, T.情境手機.結束].map((value) => value - T.情境手機.開始);
  const sources = ["map.png", "audience.png", "schedule.png"];
  return <>{sources.map((src, index) => {
    const fadeIn = index === 0 ? 1 : interpolate(frame, [bounds[index], bounds[index] + 6], [0, 1], clamp);
    const fadeOut = interpolate(frame, [bounds[index + 1], bounds[index + 1] + 6], [1, 0], clamp);
    return <Img key={src} src={staticFile(OVERVIEW(src))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity: Math.min(fadeIn, fadeOut) }} />;
  })}<Sequence from={bounds[3]} durationInFrames={bounds[4] - bounds[3]}>
    <OffthreadVideo muted trimBefore={24} src={staticFile(OVERVIEW("search_flow.mp4"))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </Sequence></>;
};

// 情境段手機固定左側全程在場（右側改由場景卡/輸入框連動，不再移中）
const ScenarioPhone: React.FC<{ T: OverviewIntroProps["時間軸"] }> = ({ T }) => <PhoneFrame enterFrame={2} x={-340}><ScenarioScreens T={T} /></PhoneFrame>;

const BlackFade: React.FC<{ len: number }> = ({ len }) => <div style={{ position: "absolute", inset: 0, background: "#000", opacity: interpolate(useCurrentFrame(), [0, len - 1], [0, 1], clamp) }} />;

const ScenarioTrack: React.FC<{ track: Track; card: { 標題: string; 副標: string }; color: string; panel?: string; note?: string; linkFrom?: [number, number]; linkTo?: [number, number]; maxWidth?: number; children?: React.ReactNode }> = ({ track, card, color, panel, note, linkFrom, linkTo, maxWidth = 330, children }) => <TrackFade len={duration(track)}>
  {panel && <SlidePanel src={panel} />}
  {linkFrom && linkTo && <LinkLine from={linkFrom} to={linkTo} at={12} color={color} />}
  {note && <PanelNote text={note} at={18} />}
  {children}
  <SmallCard title={card.標題} subtitle={card.副標} maxWidth={maxWidth} />
</TrackFade>;

export const OverviewIntro: React.FC<OverviewIntroProps> = ({ 時間軸: T, 文案, 樣式 }) => {
  const frame = useCurrentFrame();
  const frostFade = interpolate(frame, [T.情境手機.開始, T.情境手機.開始 + 12], [1, 0], clamp);
  const 色 = 樣式.標示色;
  return <AbsoluteFill style={{ background: "#05080e", fontFamily: FONT, overflow: "hidden" }}>
    <Backgrounds T={T} />
    {frame >= T.快速總覽.開始 && frame < T.情境手機.開始 + 12 && <div style={{ position: "absolute", inset: 0, opacity: frostFade, background: `rgba(246,247,249,${樣式.霧面不透明度})`, backdropFilter: "blur(16px)" }} />}
    <Sequence name="標題段" from={T.標題段.開始} durationInFrames={duration(T.標題段)}><TrackFade len={duration(T.標題段)}><TitleCard index={0} title={文案.標題} subtitle={文案.副標} enterFrame={0} /></TrackFade></Sequence>
    <Sequence name="服務台段" from={T.服務台段.開始} durationInFrames={duration(T.服務台段)}><TrackFade len={duration(T.服務台段)}><PhoneFrame enterFrame={4} x={380}><Img src={staticFile(OVERVIEW("home.png"))} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></PhoneFrame><SmallCard title={文案.服務台卡.標題} subtitle={文案.服務台卡.副標} /></TrackFade></Sequence>
    <Sequence name="快速總覽" from={T.快速總覽.開始} durationInFrames={duration(T.快速總覽)}>{文案.首頁功能卡.map((card, index) => <Sequence key={card.標題} from={index * 60} durationInFrames={duration(T.快速總覽) - index * 60}><FeaturePhone index={index} card={card} color={色} /></Sequence>)}</Sequence>
    <Sequence name="多語介紹" from={T.多語介紹.開始} durationInFrames={duration(T.多語介紹)}><DockedSnapshot cards={文案.首頁功能卡} color={色} /><PhoneFrame enterFrame={2} overlay={<FingerTap src={AIR("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={1} target={[315, 80]} from={[-644, 575]} start={74} tapAt={96} end={136} />}><LanguageScreens /></PhoneFrame><LangChip text={文案.英文語系標籤} from={0} to={70} /><LangChip text={文案.日文語系標籤} from={70} to={140} /><SmallCard title={文案.首頁功能卡[0].標題} subtitle={文案.首頁功能卡[0].副標} maxWidth={560} enterFrame={12} /></Sequence>
    <Sequence name="情境手機" from={T.情境手機.開始} durationInFrames={duration(T.情境手機)}><ScenarioPhone T={T} /></Sequence>
    <Sequence name="情境一找休息" from={T.情境一找休息.開始} durationInFrames={duration(T.情境一找休息)}><ScenarioTrack track={T.情境一找休息} card={文案.情境卡[0]} color={色} panel="rest_area.png" note={文案.場景卡註[0]} linkFrom={[600, 620]} linkTo={[1074, 560]} /></Sequence>
    <Sequence name="情境二下一站" from={T.情境二下一站.開始} durationInFrames={duration(T.情境二下一站)}><ScenarioTrack track={T.情境二下一站} card={文案.情境卡[1]} color={色} panel="rec_repair.jpg" note={文案.場景卡註[1]} linkFrom={[680, 540]} linkTo={[1074, 560]} /></Sequence>
    <Sequence name="情境三展演提醒" from={T.情境三展演提醒.開始} durationInFrames={duration(T.情境三展演提醒)}><ScenarioTrack track={T.情境三展演提醒} card={文案.情境卡[2]} color={色} panel="rec_dt668.png" note={文案.場景卡註[2]} linkFrom={[680, 430]} linkTo={[1074, 560]} /></Sequence>
    <Sequence name="情境四搜尋" from={T.情境四搜尋.開始} durationInFrames={duration(T.情境四搜尋)}><ScenarioTrack track={T.情境四搜尋} card={文案.情境卡[3]} color={色} maxWidth={520} linkFrom={[832, 470]} linkTo={[1074, 420]}>
      <SearchMock keyword={文案.搜尋關鍵字} result={文案.搜尋結果項} note={文案.搜尋註} color={色} />
      <TapCursor fromXY={[1700, 950]} toXY={[1390, 538]} start={86} tapAt={108} end={150} />
    </ScenarioTrack></Sequence>
    <Sequence name="黑幕淡出" from={T.黑幕淡出.開始} durationInFrames={duration(T.黑幕淡出)}><BlackFade len={duration(T.黑幕淡出)} /></Sequence>
  </AbsoluteFill>;
};
