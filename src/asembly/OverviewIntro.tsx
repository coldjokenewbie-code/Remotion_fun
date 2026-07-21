import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FONT, PhoneFrame, ScanView } from "./shared";

export const KEYFRAMES: number[] = [60, 100, 160, 235, 292, 337, 382, 427, 465];

const AIR = (name: string) => `asembly/airraid/${name}`;
const OVERVIEW = (name: string) => `asembly/overview/${name}`;
// AirRaidDemo v7 實圖量測值（scan_panel 為 480×1040 素材座標）
const SCAN_QR = { x: 197, y: 560, size: 115 };

const XFADE = 12; // 段間交叉淡變幀數
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ═══ 時間軸與文案由 props 控制（Studio 右欄可調；預設值＝分鏡 v2 定稿）═══
const 幀 = (預設: number, 說明: string) => z.number().int().min(0).max(3000).default(預設).describe(說明);
const 卡 = z.object({ 標題: z.string(), 副標: z.string() });

export const overviewIntroSchema = z.object({
  時間軸: z.object({
    段2a掃展牌: 幀(120, "標題段結束→掃展牌段開始"),
    段2b服務台: 幀(200, "掃展牌→服務台段"),
    段3休息: 幀(270, "服務台→情境① 找休息與服務"),
    段3下一站: 幀(315, "情境② 下一站推薦開始"),
    段3提醒: 幀(360, "情境③ 展演提醒開始"),
    段3搜尋: 幀(405, "情境④ 搜尋開始（手機滑至中央）"),
    淡出開始: 幀(450, "淡黑接第一支功能片"),
    總長: 幀(480, "影片總長（幀，30fps）"),
  }),
  文案: z.object({
    館名: z.string().default("國家鐵道博物館"),
    主標: z.string().default("組立工場\n行動導覽系統"),
    服務定位: z.string().default("服務定位：老職工帶路，重現組立工場記憶與痕跡"),
    掃展牌卡: 卡.default({ 標題: "掃描展牌 QR code", 副標: "直達展品功能頁" }),
    服務台卡: 卡.default({ 標題: "掃描服務台 QR code 或點選連結", 副標: "進入首頁尋找服務" }),
    掃描完成標語: z.string().default("✓ 已辨識・開啟展品功能頁"),
    情境卡: z.array(卡).length(4).default([
      { 標題: "找休息與服務", 副標: "地圖標示服務地點" },
      { 標題: "不知道接下來看什麼", 副標: "組立·下一站推薦" },
      { 標題: "重要展演即將開始", 副標: "主動提醒" },
      { 標題: "尋找特定展項", 副標: "輸入名稱直達展品頁" },
    ]),
  }),
});
export type OverviewIntroProps = z.infer<typeof overviewIntroSchema>;
export const overviewIntroDefaultProps: OverviewIntroProps = overviewIntroSchema.parse({ 時間軸: {}, 文案: {} });

type Timing = { seg2a: number; seg2b: number; s3a: number; s3b: number; s3c: number; s3d: number; fadeOut: number; total: number };
const toT = (t: OverviewIntroProps["時間軸"]): Timing => ({
  seg2a: t.段2a掃展牌, seg2b: t.段2b服務台, s3a: t.段3休息, s3b: t.段3下一站,
  s3c: t.段3提醒, s3d: t.段3搜尋, fadeOut: t.淡出開始, total: t.總長,
});

// ── 場景層（與前景分離：同背景跨多段時 Ken Burns 連續不重啟）────
const SceneLayer: React.FC<{ T: Timing }> = ({ T }) => {
  const frame = useCurrentFrame();
  const H = XFADE / 2;
  const scenes = [
    { src: OVERVIEW("p2_scene.png"), from: 0, to: T.seg2a + H, dim: 0.24, scale: undefined as number | undefined, origin: undefined as string | undefined },
    { src: AIR("scene3_0B7_close.png"), from: T.seg2a - H, to: T.seg2b + H, dim: 0.3, scale: 1.19, origin: "12.5% 56%" },
    { src: OVERVIEW("counter_scan.png"), from: T.seg2b - H, to: T.s3a + H, dim: 0.24, scale: undefined, origin: undefined },
    { src: OVERVIEW("hall_rest.jpg"), from: T.s3a - H, to: T.s3b + H, dim: 0.24, scale: undefined, origin: undefined },
    { src: OVERVIEW("hall_next.jpg"), from: T.s3b - H, to: T.total, dim: 0.24, scale: undefined, origin: undefined },
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

// ── 前景群組淡出包裝（進場靠子元件 spring，退場統一 6 幀淡出）──
const FgGroup: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const opacity = interpolate(frame, [to - 6, to], [1, 0], clamp);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

// ── 小標字卡（左上，比照 TitleCard 視覺、無編號列）──────────────
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

// ── 右側滑入示意卡（最外層定位，避免巢狀 transform 裁切問題）────
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

// ── 段1 中央標題＋服務定位卡（淡出時點隨段2a 連動）─────────────
const IntroTitle: React.FC<{ endAt: number; 館名: string; 主標: string; 服務定位: string }> = ({ endAt, 館名, 主標, 服務定位 }) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [10, 28, endAt - 15, endAt], [0, 1, 1, 0], clamp);
  const serviceOpacity = interpolate(frame, [60, 76, endAt - 8, endAt], [0, 1, 1, 0], clamp);
  const titleScale = interpolate(frame, [10, 70], [0.94, 1], clamp);
  return <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
    <div style={{ textAlign: "center", opacity: titleOpacity, transform: `scale(${titleScale})`, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)" }}>
      <div style={{ color: "#ffad73", fontSize: 26, fontWeight: 800, letterSpacing: 8 }}>{館名}</div>
      <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.28, letterSpacing: 8, marginTop: 18, whiteSpace: "pre-line" }}>{主標}</div>
    </div>
    <div style={{ opacity: serviceOpacity, marginTop: 42, background: "rgba(15,18,25,0.78)", borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "18px 28px", color: "#fff", fontSize: 28, fontWeight: 600, letterSpacing: 1.5 }}>
      {服務定位}
    </div>
  </div>;
};

// ── 段3 手機螢幕（單一 PhoneFrame 連續在場，內容 6 幀交叉淡變）──
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

export const OverviewIntro: React.FC<OverviewIntroProps> = ({ 時間軸, 文案 }) => {
  const frame = useCurrentFrame();
  const T = toT(時間軸);
  const fade = interpolate(frame, [T.fadeOut, T.fadeOut + 24], [0, 1], clamp);
  const stepBounds = [T.s3a, T.s3b, T.s3c, T.s3d, T.fadeOut];
  // 段3 手機：s3a 進場一次，s3d 起 12 幀滑至中央（不重進場）
  const stepPhoneX = interpolate(frame, [T.s3d, T.s3d + 12], [-340, 0], clamp);
  return <AbsoluteFill style={{ background: "#05080e", fontFamily: FONT, overflow: "hidden" }}>
    <SceneLayer T={T} />

    {/* 段1 定位（W710 p2 實照） */}
    <FgGroup from={0} to={T.seg2a}>
      <IntroTitle endAt={T.seg2a} 館名={文案.館名} 主標={文案.主標} 服務定位={文案.服務定位} />
    </FgGroup>

    {/* 段2a 掃展牌（重現 01 片 4 秒組成） */}
    <FgGroup from={T.seg2a} to={T.seg2b}>
      <PhoneFrame enterFrame={T.seg2a + 8} x={380} hand={AIR("hand_hold.png")}>
        <ScanView bg={AIR("scan_panel.png")} from={T.seg2a + 18} to={T.seg2b - 4} qr={SCAN_QR} doneLabel={文案.掃描完成標語} />
      </PhoneFrame>
      <SmallCard title={文案.掃展牌卡.標題} subtitle={文案.掃展牌卡.副標} enterFrame={T.seg2a + 6} />
    </FgGroup>

    {/* 段2b 服務台 */}
    <FgGroup from={T.seg2b} to={T.s3a}>
      <PhoneFrame enterFrame={T.seg2b + 4} x={380}>
        <Img src={staticFile(OVERVIEW("home.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </PhoneFrame>
      <SmallCard title={文案.服務台卡.標題} subtitle={文案.服務台卡.副標} enterFrame={T.seg2b + 2} />
    </FgGroup>

    {/* 段3 參訪過程四情境：手機單次進場連續在場，螢幕內容交叉淡變；情境④ 滑至中央 */}
    <FgGroup from={T.s3a} to={T.fadeOut}>
      <PhoneFrame enterFrame={T.s3a + 2} x={stepPhoneX}>
        <StepScreens bounds={stepBounds} />
      </PhoneFrame>
    </FgGroup>
    {文案.情境卡.map((card, i) => (
      <FgGroup key={i} from={stepBounds[i]} to={stepBounds[i + 1]}>
        {STEP_PANELS[i] && <SlidePanel src={STEP_PANELS[i]!} enterFrame={stepBounds[i] + 12} />}
        <SmallCard title={card.標題} subtitle={card.副標} enterFrame={stepBounds[i] + 2} />
      </FgGroup>
    ))}

    {/* 轉場：淡出接功能片（背景由 SceneLayer 的 hall_next 延續至總長） */}
    {fade > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade }} />}
  </AbsoluteFill>;
};
