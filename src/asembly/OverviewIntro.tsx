import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FingerTap, FONT, PhoneFrame, TitleCard } from "./shared";

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
    情境四搜尋: 軌(740, 920, "搜尋實錄與點按"),
    黑幕淡出: 軌(920, 950, "淡黑收尾；結束幀為總長"),
  }),
  樣式: z.object({ 霧面不透明度: z.number().min(0).max(1).default(0.4) }),
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

const FeatureRings: React.FC<{ index: number; enterFrame?: number }> = ({ index, enterFrame = 6 }) => {
  const frame = useCurrentFrame();
  const alpha = interpolate(frame, [enterFrame, enterFrame + 10], [0, 1], clamp);
  const pulse = 1 + 0.015 * Math.sin(((frame - enterFrame) / 18) * Math.PI * 2);
  return <>{RINGS[index].map((ring, ringIndex) => <div key={ringIndex} style={{ position: "absolute", left: ring.x, top: ring.y, width: ring.w, height: ring.h, border: "3.5px solid #ff8a3d", borderRadius: ring.r, opacity: alpha, transform: `scale(${pulse})`, boxShadow: "0 0 18px rgba(255,138,61,.55), inset 0 0 14px rgba(255,138,61,.25)" }} />)}</>;
};

const DockLabel: React.FC<{ title: string; x: number; opacity: number }> = ({ title, x, opacity }) => <div style={{ position: "absolute", left: "50%", top: 855, opacity, transform: `translateX(calc(-50% + ${x}px))`, padding: "8px 22px", borderRadius: 999, border: "2px solid #ff8a3d", background: "rgba(15,18,25,.9)", color: "#fff", fontFamily: FONT, fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{title}</div>;

const FeaturePhone: React.FC<{ index: number; title: string }> = ({ index, title }) => {
  const frame = useCurrentFrame();
  const dock = interpolate(frame, [46, 60], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const x = interpolate(dock, [0, 1], [0, SLOT_X[index]]);
  const scale = interpolate(dock, [0, 1], [1, 0.62]);
  return <><PhoneFrame enterFrame={2} x={x} scale={scale}>
    <Img src={staticFile(OVERVIEW("home.png"))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    <FeatureRings index={index} />
  </PhoneFrame><DockLabel title={title} x={SLOT_X[index]} opacity={interpolate(dock, [.55, 1], [0, 1], clamp)} /></>;
};

const DockedSnapshot: React.FC<{ cards: OverviewIntroProps["文案"]["首頁功能卡"] }> = ({ cards }) => {
  const opacity = interpolate(useCurrentFrame(), [0, 10], [1, 0], clamp);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{cards.map((card, index) => <React.Fragment key={card.標題}>
    <PhoneFrame enterFrame={-60} x={SLOT_X[index]} scale={0.62}>
      <Img src={staticFile(OVERVIEW("home.png"))} style={{ width: "100%", height: "100%", objectFit: "cover" }} /><FeatureRings index={index} enterFrame={-60} />
    </PhoneFrame><DockLabel title={card.標題} x={SLOT_X[index]} opacity={1} />
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

const ScenarioPhone: React.FC<{ T: OverviewIntroProps["時間軸"] }> = ({ T }) => {
  const frame = useCurrentFrame();
  const moveAt = T.情境四搜尋.開始 - T.情境手機.開始;
  const x = interpolate(frame, [moveAt, moveAt + 12], [-340, 0], clamp);
  return <PhoneFrame enterFrame={2} x={x} overlay={<FingerTap src={AIR("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={1} target={[210, 516]} from={[-644, 575]} start={moveAt + 72} tapAt={moveAt + 102} end={moveAt + 160} />}><ScenarioScreens T={T} /></PhoneFrame>;
};

const BlackFade: React.FC<{ len: number }> = ({ len }) => <div style={{ position: "absolute", inset: 0, background: "#000", opacity: interpolate(useCurrentFrame(), [0, len - 1], [0, 1], clamp) }} />;

const ScenarioTrack: React.FC<{ track: Track; card: { 標題: string; 副標: string }; panel?: string; maxWidth?: number }> = ({ track, card, panel, maxWidth = 330 }) => <TrackFade len={duration(track)}>{panel && <SlidePanel src={panel} />}<SmallCard title={card.標題} subtitle={card.副標} maxWidth={maxWidth} /></TrackFade>;

export const OverviewIntro: React.FC<OverviewIntroProps> = ({ 時間軸: T, 文案, 樣式 }) => {
  const frame = useCurrentFrame();
  const frostFade = interpolate(frame, [T.情境手機.開始, T.情境手機.開始 + 12], [1, 0], clamp);
  return <AbsoluteFill style={{ background: "#05080e", fontFamily: FONT, overflow: "hidden" }}>
    <Backgrounds T={T} />
    {frame >= T.快速總覽.開始 && frame < T.情境手機.開始 + 12 && <div style={{ position: "absolute", inset: 0, opacity: frostFade, background: `rgba(246,247,249,${樣式.霧面不透明度})`, backdropFilter: "blur(16px)" }} />}
    <Sequence name="標題段" from={T.標題段.開始} durationInFrames={duration(T.標題段)}><TrackFade len={duration(T.標題段)}><TitleCard index={0} title={文案.標題} subtitle={文案.副標} enterFrame={0} /></TrackFade></Sequence>
    <Sequence name="服務台段" from={T.服務台段.開始} durationInFrames={duration(T.服務台段)}><TrackFade len={duration(T.服務台段)}><PhoneFrame enterFrame={4} x={380}><Img src={staticFile(OVERVIEW("home.png"))} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></PhoneFrame><SmallCard title={文案.服務台卡.標題} subtitle={文案.服務台卡.副標} /></TrackFade></Sequence>
    <Sequence name="快速總覽" from={T.快速總覽.開始} durationInFrames={duration(T.快速總覽)}>{文案.首頁功能卡.map((card, index) => <Sequence key={card.標題} from={index * 60} durationInFrames={duration(T.快速總覽) - index * 60}><FeaturePhone index={index} title={card.標題} /></Sequence>)}</Sequence>
    <Sequence name="多語介紹" from={T.多語介紹.開始} durationInFrames={duration(T.多語介紹)}><DockedSnapshot cards={文案.首頁功能卡} /><PhoneFrame enterFrame={2} overlay={<FingerTap src={AIR("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={1} target={[315, 80]} from={[-644, 575]} start={74} tapAt={96} end={136} />}><LanguageScreens /></PhoneFrame><LangChip text={文案.英文語系標籤} from={0} to={70} /><LangChip text={文案.日文語系標籤} from={70} to={140} /><SmallCard title={文案.首頁功能卡[0].標題} subtitle={文案.首頁功能卡[0].副標} maxWidth={560} /></Sequence>
    <Sequence name="情境手機" from={T.情境手機.開始} durationInFrames={duration(T.情境手機)}><ScenarioPhone T={T} /></Sequence>
    <Sequence name="情境一找休息" from={T.情境一找休息.開始} durationInFrames={duration(T.情境一找休息)}><ScenarioTrack track={T.情境一找休息} card={文案.情境卡[0]} panel="rest_area.png" /></Sequence>
    <Sequence name="情境二下一站" from={T.情境二下一站.開始} durationInFrames={duration(T.情境二下一站)}><ScenarioTrack track={T.情境二下一站} card={文案.情境卡[1]} panel="rec_repair.jpg" /></Sequence>
    <Sequence name="情境三展演提醒" from={T.情境三展演提醒.開始} durationInFrames={duration(T.情境三展演提醒)}><ScenarioTrack track={T.情境三展演提醒} card={文案.情境卡[2]} panel="rec_dt668.png" /></Sequence>
    <Sequence name="情境四搜尋" from={T.情境四搜尋.開始} durationInFrames={duration(T.情境四搜尋)}><ScenarioTrack track={T.情境四搜尋} card={文案.情境卡[3]} maxWidth={520} /></Sequence>
    <Sequence name="黑幕淡出" from={T.黑幕淡出.開始} durationInFrames={duration(T.黑幕淡出)}><BlackFade len={duration(T.黑幕淡出)} /></Sequence>
  </AbsoluteFill>;
};
