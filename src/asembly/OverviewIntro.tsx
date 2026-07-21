import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, PhoneFrame, ScanView } from "./shared";

export const KEYFRAMES: number[] = [60, 100, 160, 235, 292, 337, 382, 427, 465];

const AIR = (name: string) => `asembly/airraid/${name}`;
const OVERVIEW = (name: string) => `asembly/overview/${name}`;
// AirRaidDemo v7 實圖量測值（scan_panel 為 480×1040 素材座標）
const SCAN_QR = { x: 197, y: 560, size: 115 };

const XFADE = 12; // 段間交叉淡變幀數
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ── 場景層（與前景分離：同背景跨多段時 Ken Burns 連續不重啟）────
// 相鄰場景窗重疊 XFADE 幀做交叉淡變
const SCENES = [
  { src: OVERVIEW("p2_scene.png"), from: 0, to: 126, dim: 0.24 },
  { src: AIR("scene3_0B7_close.png"), from: 114, to: 206, dim: 0.3, scale: 1.19, origin: "12.5% 56%" },
  { src: OVERVIEW("counter_scan.png"), from: 194, to: 276, dim: 0.24 },
  { src: OVERVIEW("hall_rest.jpg"), from: 264, to: 321, dim: 0.24 },
  { src: OVERVIEW("hall_next.jpg"), from: 309, to: 480, dim: 0.24 },
] as const;

const SceneLayer: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    {SCENES.map((s) => {
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
            transform: `scale(${"scale" in s && s.scale ? s.scale : kb})`,
            transformOrigin: ("origin" in s && s.origin) || "50% 50%",
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

// ── 段1 中央標題＋服務定位卡 ────────────────────────────────────
const IntroTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [10, 28, 105, 120], [0, 1, 1, 0], clamp);
  const serviceOpacity = interpolate(frame, [60, 76, 112, 120], [0, 1, 1, 0], clamp);
  const titleScale = interpolate(frame, [10, 70], [0.94, 1], clamp);
  return <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
    <div style={{ textAlign: "center", opacity: titleOpacity, transform: `scale(${titleScale})`, color: "#fff", textShadow: "0 4px 24px rgba(0,0,0,0.7)" }}>
      <div style={{ color: "#ffad73", fontSize: 26, fontWeight: 800, letterSpacing: 8 }}>國家鐵道博物館</div>
      <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.28, letterSpacing: 8, marginTop: 18, whiteSpace: "pre-line" }}>組立工場{"\n"}行動導覽系統</div>
    </div>
    <div style={{ opacity: serviceOpacity, marginTop: 42, background: "rgba(15,18,25,0.78)", borderLeft: "6px solid #ff8a3d", borderRadius: 10, padding: "18px 28px", color: "#fff", fontSize: 28, fontWeight: 600, letterSpacing: 1.5 }}>
      服務定位：老職工帶路，重現組立工場記憶與痕跡
    </div>
  </div>;
};

// ── 段3 手機螢幕（單一 PhoneFrame 連續在場，內容 6 幀交叉淡變）──
const STEP_SCREENS = [
  { src: "map.png", from: 270, to: 315 },
  { src: "audience.png", from: 315, to: 360 },
  { src: "schedule.png", from: 360, to: 405 },
  { src: "search_typing.png", from: 405, to: 450 },
] as const;

const StepScreens: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    {STEP_SCREENS.map((s, i) => {
      const fadeIn = i === 0 ? 1 : interpolate(frame, [s.from, s.from + 6], [0, 1], clamp);
      const fadeOut = i === STEP_SCREENS.length - 1 ? 1 : interpolate(frame, [s.to, s.to + 6], [1, 0], clamp);
      const opacity = Math.min(fadeIn, fadeOut);
      if (opacity <= 0) return null;
      return <Img key={s.src} src={staticFile(OVERVIEW(s.src))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity }} />;
    })}
  </>;
};

// ── 段別參數表（270f 起四情境；手機由外層連續掛載，這裡只管卡片）─
const STEPS = [
  { from: 270, to: 315, panel: OVERVIEW("rest_area.png"), title: "找休息與服務", subtitle: "地圖標示服務地點" },
  { from: 315, to: 360, panel: OVERVIEW("rec_repair.jpg"), title: "不知道接下來看什麼", subtitle: "組立·下一站推薦" },
  { from: 360, to: 405, panel: OVERVIEW("rec_dt668.png"), title: "重要展演即將開始", subtitle: "主動提醒" },
  { from: 405, to: 450, panel: null, title: "尋找特定展項", subtitle: "輸入名稱直達展品頁" },
] as const;

export const OverviewIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [450, 474], [0, 1], clamp);
  // 段3 手機：270 進場一次，405 起 12 幀滑至中央（不重進場）
  const stepPhoneX = interpolate(frame, [405, 417], [-340, 0], clamp);
  return <AbsoluteFill style={{ background: "#05080e", fontFamily: FONT, overflow: "hidden" }}>
    <SceneLayer />

    {/* 段1 定位（W710 p2 實照） */}
    <FgGroup from={0} to={120}>
      <IntroTitle />
    </FgGroup>

    {/* 段2a 掃展牌（重現 01 片 4 秒組成） */}
    <FgGroup from={120} to={200}>
      <PhoneFrame enterFrame={128} x={380} hand={AIR("hand_hold.png")}>
        <ScanView bg={AIR("scan_panel.png")} from={138} to={196} qr={SCAN_QR} doneLabel="✓ 已辨識・開啟展品功能頁" />
      </PhoneFrame>
      <SmallCard title="掃描展牌 QR code" subtitle="直達展品功能頁" enterFrame={126} />
    </FgGroup>

    {/* 段2b 服務台 */}
    <FgGroup from={200} to={270}>
      <PhoneFrame enterFrame={204} x={380}>
        <Img src={staticFile(OVERVIEW("home.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </PhoneFrame>
      <SmallCard title="掃描服務台 QR code 或點選連結" subtitle="進入首頁尋找服務" enterFrame={202} />
    </FgGroup>

    {/* 段3 參訪過程四情境：手機單次進場連續在場，螢幕內容交叉淡變；3④ 滑至中央 */}
    <FgGroup from={270} to={450}>
      <PhoneFrame enterFrame={272} x={stepPhoneX}>
        <StepScreens />
      </PhoneFrame>
    </FgGroup>
    {STEPS.map((s) => (
      <FgGroup key={s.from} from={s.from} to={s.to}>
        {s.panel && <SlidePanel src={s.panel} enterFrame={s.from + 12} />}
        <SmallCard title={s.title} subtitle={s.subtitle} enterFrame={s.from + 2} />
      </FgGroup>
    ))}

    {/* 轉場：淡出接功能片（背景由 SceneLayer 的 hall_next 延續至 480） */}
    {fade > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade }} />}
  </AbsoluteFill>;
};
