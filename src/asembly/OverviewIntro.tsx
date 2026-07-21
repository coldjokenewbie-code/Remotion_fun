import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FONT, PhoneAssetFrame, PhoneBubble, PhoneFrame, ScanView } from "./shared";

export const KEYFRAMES: number[] = [60, 100, 160, 235, 292, 337, 382, 427, 465];

const AIR = (name: string) => `asembly/airraid/${name}`;
const OVERVIEW = (name: string) => `asembly/overview/${name}`;
// AirRaidDemo 現行拉出面板素材座標
const SCAN_QR = { x: 123, y: 544, size: 133 };

const XFADE = 12; // 場景交叉淡變幀數
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ═══ CDIC_O4 式軌道制：每軌獨立 {開始,結束}，Sequence 名稱＝欄位名 ═══
// Studio 下方時間軸左側軌名與右欄 props「時間軸」群組一對一對應。
const 軌 = (開始: number, 結束: number, 說明: string) =>
  z.object({
    開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
    結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
  }).default({ 開始, 結束 });

export const overviewIntroSchema = z.object({
  時間軸: z.object({
    標題段: 軌(0, 120, "中央標題＋服務定位卡（p2 實照背景）"),
    掃展牌段: 軌(120, 200, "手機掃展牌 QR（新面板樣式，同 01 片）"),
    服務台段: 軌(200, 270, "服務台掃碼→App 首頁"),
    情境手機: 軌(270, 450, "情境段連續在場的手機（螢幕隨各情境切換）"),
    情境一找休息: 軌(270, 315, "地圖頁＋服務區示意卡"),
    情境二下一站: 軌(315, 360, "下一站推薦頁＋維修展演卡"),
    情境三展演提醒: 軌(360, 405, "展演時刻頁＋DT668 卡"),
    情境四搜尋: 軌(405, 450, "搜尋頁（手機滑至中央）"),
    黑幕淡出: 軌(450, 480, "淡黑接第一支功能片；結束幀＝影片總長"),
  }),
  文案: z.object({
    館名: z.string().default("國家鐵道博物館"),
    主標: z.string().default("組立工場\n行動導覽系統"),
    服務定位: z.string().default("服務定位：老職工帶路，重現組立工場記憶與痕跡"),
    掃展牌卡: z.object({ 標題: z.string(), 副標: z.string() }).default({ 標題: "掃描展牌 QR code", 副標: "直達展品功能頁" }),
    服務台卡: z.object({ 標題: z.string(), 副標: z.string() }).default({ 標題: "掃描服務台 QR code 或點選連結", 副標: "進入首頁尋找服務" }),
    掃描完成標語: z.string().default("✓ 已辨識・開啟展品功能頁"),
    情境卡: z.array(z.object({ 標題: z.string(), 副標: z.string() })).length(4).default([
      { 標題: "找休息與服務", 副標: "地圖標示服務地點" },
      { 標題: "不知道接下來看什麼", 副標: "組立·下一站推薦" },
      { 標題: "重要展演即將開始", 副標: "主動提醒" },
      { 標題: "尋找特定展項", 副標: "輸入名稱直達展品頁" },
    ]),
  }),
});
export type OverviewIntroProps = z.infer<typeof overviewIntroSchema>;
export const overviewIntroDefaultProps: OverviewIntroProps = overviewIntroSchema.parse({ 時間軸: {}, 文案: {} });

type Track = { 開始: number; 結束: number };
const dur = (t: Track) => t.結束 - t.開始;

// ── 場景層（隨各軌時間連動交叉淡變；同背景跨多段時 Ken Burns 連續）─
const SceneLayer: React.FC<{ T: OverviewIntroProps["時間軸"] }> = ({ T }) => {
  const frame = useCurrentFrame();
  const H = XFADE / 2;
  const scenes = [
    { src: OVERVIEW("p2_scene.png"), from: T.標題段.開始, to: T.掃展牌段.開始 + H, dim: 0.24, scale: undefined as number | undefined, origin: undefined as string | undefined },
    { src: AIR("scene3_0B7_close.png"), from: T.掃展牌段.開始 - H, to: T.服務台段.開始 + H, dim: 0.3, scale: 1.19, origin: "12.5% 56%" },
    { src: OVERVIEW("counter_scan.png"), from: T.服務台段.開始 - H, to: T.情境一找休息.開始 + H, dim: 0.24, scale: undefined, origin: undefined },
    // PO 2026-07-21：情境一背景改與後三段相同（hall_next），hall_rest（LINE_10 含烘焙標註字）停用
    { src: OVERVIEW("hall_next.jpg"), from: T.情境一找休息.開始 - H, to: T.黑幕淡出.結束, dim: 0.24, scale: undefined, origin: undefined },
  ];
  return <>
    {scenes.map((s) => {
      if (frame < s.from || frame >= s.to) return null;
      const opacity = Math.min(
        interpolate(frame, [s.from, s.from + XFADE], [0, 1], clamp),
        interpolate(frame, [s.to - XFADE, s.to], [1, 0], clamp),
      );
      const kb = interpolate(frame, [s.from, s.to], [1.04, 1.1], clamp);
      return (
        <div key={s.src} style={{ position: "absolute", inset: 0, opacity }}>
          <Img src={staticFile(s.src)} style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${s.scale ?? kb})`, transformOrigin: s.origin ?? "50% 50%",
          }} />
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${s.dim})` }} />
        </div>
      );
    })}
  </>;
};

// ── 軌內退場淡出包裝（相對幀：軌長最後 6 幀淡出）────────────────
const TrackFade: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const frame = useCurrentFrame(); // Sequence 內相對幀
  const opacity = interpolate(frame, [len - 6, len], [1, 0], clamp);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

// ── 小標字卡（左上；enterFrame 為軌內相對幀）───────────────────
const SmallCard: React.FC<{ title: string; subtitle: string; enterFrame: number }> = ({ title, subtitle, enterFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  return (
    <div style={{
      position: "absolute", top: 56, left: 64, maxWidth: 900,
      transform: `translateX(${interpolate(p, [0, 1], [-60, 0])}px)`, opacity: p,
      background: "rgba(15,18,25,0.78)", backdropFilter: "blur(6px)",
      borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "20px 28px", fontFamily: FONT,
    }}>
      <div style={{ color: "#fff", fontSize: 36, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
      <div style={{ color: "#d8dde6", fontSize: 22, marginTop: 6, letterSpacing: 1 }}>{subtitle}</div>
    </div>
  );
};

// ── 右側滑入示意卡（enterFrame 為軌內相對幀）───────────────────
const SlidePanel: React.FC<{ src: string; enterFrame: number }> = ({ src, enterFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterFrame, fps, config: { damping: 200 } });
  return (
    <div style={{
      position: "absolute", left: 1080, top: 340, width: 760,
      transform: `translateX(${interpolate(p, [0, 1], [560, 0])}px)`, opacity: p,
      background: "#fff", borderRadius: 14, padding: 12,
      boxShadow: "0 16px 50px rgba(0,0,0,0.5)",
    }}>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block", borderRadius: 8 }} />
    </div>
  );
};

// ── 標題段內容（相對幀；PO：置於下三分之一避開老職工）───────────
const IntroTitle: React.FC<{ len: number; 館名: string; 主標: string; 服務定位: string }> = ({ len, 館名, 主標, 服務定位 }) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [10, 28, len - 15, len], [0, 1, 1, 0], clamp);
  const serviceOpacity = interpolate(frame, [60, 76, len - 8, len], [0, 1, 1, 0], clamp);
  const titleScale = interpolate(frame, [10, 70], [0.94, 1], clamp);
  return <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 56, fontFamily: FONT }}>
    <div style={{ textAlign: "center", opacity: titleOpacity, transform: `scale(${titleScale})`, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)" }}>
      <div style={{ color: "#ffad73", fontSize: 26, fontWeight: 800, letterSpacing: 8 }}>{館名}</div>
      <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.26, letterSpacing: 8, marginTop: 14, whiteSpace: "pre-line" }}>{主標}</div>
    </div>
    <div style={{ opacity: serviceOpacity, marginTop: 28, background: "rgba(15,18,25,0.78)", borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "16px 26px", color: "#fff", fontSize: 26, fontWeight: 600, letterSpacing: 1.5 }}>
      {服務定位}
    </div>
  </div>;
};

// ── 情境手機螢幕（bounds 為「情境手機」軌內相對幀）──────────────
const STEP_SCREEN_SRCS = ["map.png", "audience.png", "schedule.png", "search_typing.png"] as const;

const StepScreens: React.FC<{ bounds: number[] }> = ({ bounds }) => {
  const frame = useCurrentFrame();
  return <>
    {STEP_SCREEN_SRCS.map((src, i) => {
      const fadeIn = i === 0 ? 1 : interpolate(frame, [bounds[i], bounds[i] + 6], [0, 1], clamp);
      const fadeOut = i === STEP_SCREEN_SRCS.length - 1 ? 1 : interpolate(frame, [bounds[i + 1], bounds[i + 1] + 6], [1, 0], clamp);
      const opacity = Math.min(fadeIn, fadeOut);
      if (opacity <= 0) return null;
      return <Img key={src} src={staticFile(OVERVIEW(src))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity }} />;
    })}
  </>;
};

const STEP_PANELS = [OVERVIEW("rest_area.png"), OVERVIEW("rec_repair.jpg"), OVERVIEW("rec_dt668.png"), null] as const;

export const OverviewIntro: React.FC<OverviewIntroProps> = ({ 時間軸: T, 文案 }) => {
  const frame = useCurrentFrame();
  const 情境軌 = [T.情境一找休息, T.情境二下一站, T.情境三展演提醒, T.情境四搜尋];
  // 情境手機軌內相對的各情境起點（螢幕切換點）
  const phoneBounds = [...情境軌.map((s) => s.開始 - T.情境手機.開始), T.情境手機.結束 - T.情境手機.開始];
  const phoneX = interpolate(frame, [T.情境四搜尋.開始, T.情境四搜尋.開始 + 12], [-340, 0], clamp);
  const fade = interpolate(frame, [T.黑幕淡出.開始, T.黑幕淡出.開始 + 24], [0, 1], clamp);

  return <AbsoluteFill style={{ background: "#05080e", fontFamily: FONT, overflow: "hidden" }}>
    <Sequence name="背景場景" from={0} durationInFrames={T.黑幕淡出.結束}>
      <SceneLayer T={T} />
    </Sequence>

    <Sequence name="標題段" from={T.標題段.開始} durationInFrames={dur(T.標題段)}>
      <IntroTitle len={dur(T.標題段)} 館名={文案.館名} 主標={文案.主標} 服務定位={文案.服務定位} />
    </Sequence>

    <Sequence name="掃展牌段" from={T.掃展牌段.開始} durationInFrames={dur(T.掃展牌段)}>
      <TrackFade len={dur(T.掃展牌段)}>
        <PhoneBubble anchor={{ x: 240, y: 605 }} visibleFrom={8} visibleTo={dur(T.掃展牌段)}>
          <PhoneAssetFrame src={AIR("hand_po.png")} enterFrame={8} left={-76} top={10}>
            <ScanView bg={AIR("scan_screen_po.png")} from={18} to={dur(T.掃展牌段) - 4} qr={SCAN_QR} chrome={false} doneLabel={文案.掃描完成標語} />
          </PhoneAssetFrame>
        </PhoneBubble>
        <SmallCard title={文案.掃展牌卡.標題} subtitle={文案.掃展牌卡.副標} enterFrame={6} />
      </TrackFade>
    </Sequence>

    <Sequence name="服務台段" from={T.服務台段.開始} durationInFrames={dur(T.服務台段)}>
      <TrackFade len={dur(T.服務台段)}>
        <PhoneFrame enterFrame={4} x={380}>
          <Img src={staticFile(OVERVIEW("home.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </PhoneFrame>
        <SmallCard title={文案.服務台卡.標題} subtitle={文案.服務台卡.副標} enterFrame={2} />
      </TrackFade>
    </Sequence>

    <Sequence name="情境手機" from={T.情境手機.開始} durationInFrames={dur(T.情境手機)}>
      <TrackFade len={dur(T.情境手機)}>
        <PhoneFrame enterFrame={2} x={phoneX}>
          <StepScreens bounds={phoneBounds} />
        </PhoneFrame>
      </TrackFade>
    </Sequence>

    {情境軌.map((s, i) => (
      <Sequence key={i} name={["情境一找休息", "情境二下一站", "情境三展演提醒", "情境四搜尋"][i]} from={s.開始} durationInFrames={dur(s)}>
        <TrackFade len={dur(s)}>
          {STEP_PANELS[i] && <SlidePanel src={STEP_PANELS[i]!} enterFrame={12} />}
          <SmallCard title={文案.情境卡[i].標題} subtitle={文案.情境卡[i].副標} enterFrame={2} />
        </TrackFade>
      </Sequence>
    ))}

    <Sequence name="黑幕淡出" from={T.黑幕淡出.開始} durationInFrames={dur(T.黑幕淡出)}>
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade }} />
    </Sequence>
  </AbsoluteFill>;
};
