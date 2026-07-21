import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { EndCard, FONT, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ 每日任務示範（組立工場練習所）──時間軸與文案由 props 控制（Studio 右欄可調）═══
// 腳本：PO 每日任務_W0710 pptx 五拍——開場任務頁→五機具列表→地圖→遊玩+掃機台QR記進度→完玩領證書
// 本片無旁白；以字幕串接五段功能敘事
const 幀 = (預設: number, 說明: string) => z.number().int().min(0).max(3000).default(預設).describe(說明);
const 字幕列 = z.object({ 文字: z.string(), 起: z.number().int().min(0).max(3000), 訖: z.number().int().min(0).max(3000) });

export const questDemoSchema = z.object({
  時間軸: z.object({
    手機進場: 幀(20, "拉出面板＋手機出現幀"),
    任務清單開始: 幀(60, "任務頁→五機具清單；標示卡同時消失"),
    地圖開始: 幀(150, "清單→地圖頁"),
    遊玩場景: 幀(180, "背景切遊玩照"),
    機台掃描開始: 幀(230, "背景切鑽削機台＋掃描相機畫面（拉線同步顯示）"),
    進度更新: 幀(285, "掃描完成→進度頁 3/5（拉線於 +10 幀收起）"),
    證書場景: 幀(350, "背景切證書機台"),
    完成頁: 幀(360, "進度頁→完成領證頁 5/5"),
    淡出開始: 幀(456, "結尾黑幕淡出起點"),
    書擋開始: 幀(464, "黑幕上開頭標題卡同款書擋幀起點"),
    落款開始: 幀(546, "書擋結束→落款起點"),
    總長: 幀(600, "影片總長（幀，30fps）"),
  }),
  文案: z.object({
    標題: z.string().default("每日任務"),
    副標: z.string().default("依地圖完成五項機具任務，掃描機台 QR 記錄進度"),
    掃描中標語: z.string().default("相機・對準機台 QR"),
    掃描完成標語: z.string().default("✓ 已辨識・任務進度已記錄"),
    落款: z.string().default("五項任務完成後產生結業證書"),
    字幕: z.array(字幕列).default([
      { 文字: "系統以地圖列出五項機具任務與所在位置。", 起: 60, 訖: 210 },
      { 文字: "完成操作後掃描機台 QR，系統自動更新任務進度。", 起: 210, 訖: 350 },
      { 文字: "五項任務完成後，系統產生可下載的結業證書。", 起: 350, 訖: 450 },
    ]),
  }),
});
export type QuestDemoProps = z.infer<typeof questDemoSchema>;
export const questDemoDefaultProps: QuestDemoProps = questDemoSchema.parse({ 時間軸: {}, 文案: {} });

type Timing = { phoneIn: number; listStart: number; mapStart: number; playBg: number; drillBg: number; progAt: number; certBg: number; doneAt: number; fadeOut: number; bookendAt: number; endCardAt: number; total: number };
const toT = (t: QuestDemoProps["時間軸"]): Timing => ({
  phoneIn: t.手機進場, listStart: t.任務清單開始, mapStart: t.地圖開始, playBg: t.遊玩場景,
  drillBg: t.機台掃描開始, progAt: t.進度更新, certBg: t.證書場景, doneAt: t.完成頁,
  fadeOut: t.淡出開始, bookendAt: t.書擋開始, endCardAt: t.落款開始, total: t.總長,
});

// ── 書擋幀：開頭總覽片標題卡同款（黑幕上中央標題），與 OverviewIntro 開場呼應 ──
const BookendTitle: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const opacity = Math.min(
    interpolate(frame, [from, from + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [to - 12, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity, fontFamily: FONT }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ color: "#ffad73", fontSize: 26, fontWeight: 800, letterSpacing: 8 }}>國家鐵道博物館</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.28, letterSpacing: 8, marginTop: 18, whiteSpace: "pre-line" }}>{"組立工場\n行動導覽系統"}</div>
      </div>
    </div>
  );
};
const A = (p: string) => `asembly/quest/${p}`;
const SCENE_QR = { x: 605, y: 598, size: 52 };
const SCAN_QR = { x: 217, y: 603, size: 124 };
const ORANGE = "#e8862d";
const CREAM = "#faf7f2";

// ── App 頁面共用 ──────────────────────────────────────────────
const Header: React.FC = () => (
  <div style={{ height: 64, background: "#fff", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, borderBottom: "1px solid #eee" }}>
    <div style={{ fontSize: 20, color: "#444" }}>‹</div>
    <div style={{ fontSize: 17, fontWeight: 700, color: "#333", letterSpacing: 2 }}>任務</div>
    <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
      <div style={{ background: ORANGE, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 8px" }}>TW</div>
      <div style={{ color: "#bbb", fontSize: 10, padding: "2px 4px" }}>EN</div>
      <div style={{ color: "#bbb", fontSize: 10, padding: "2px 4px" }}>JP</div>
      <div style={{ color: "#666", fontSize: 16, marginLeft: 6 }}>≡</div>
    </div>
  </div>
);
const Prog: React.FC<{ pct: number; n: number }> = ({ pct, n }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", margin: "10px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div style={{ color: ORANGE, fontSize: 26, fontWeight: 800 }}>{pct}%</div>
      <div style={{ color: "#888", fontSize: 12, letterSpacing: 1 }}>{n} / 5 TASKS</div>
    </div>
    <div style={{ height: 6, background: "#f0e8dd", borderRadius: 3, marginTop: 8 }}>
      <div style={{ width: `${pct}%`, height: 6, background: ORANGE, borderRadius: 3 }} />
    </div>
  </div>
);
const MACHINES = [
  ["車削", "車出圓滑弧面"], ["銑削", "銑出平整表面"], ["鑽削", "鑽出精準孔位"], ["搪削", "搪大孔徑內壁"], ["鉋削", "鉋平長條工面"],
] as const;

const TaskHome: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: CREAM, fontFamily: FONT }}>
    <Header />
    <div style={{ background: "#fff", borderRadius: 12, margin: "12px 14px", padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ color: ORANGE, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>今日任務</div>
      <div style={{ color: "#2b2b2b", fontSize: 21, fontWeight: 800, marginTop: 6, lineHeight: 1.3 }}>成為組立工場技工！</div>
      <div style={{ color: ORANGE, fontSize: 14, fontWeight: 700, marginTop: 4 }}>前往組立工場練習所！</div>
      <div style={{ color: "#666", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
        學習車削、銑削、鑽削、搪削、鉋削五種工具，完成所有體驗就可領取結業證書！
      </div>
    </div>
    <Prog pct={0} n={0} />
  </div>
);

const TaskList: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: CREAM, fontFamily: FONT, overflow: "hidden" }}>
      <Header />
      <Prog pct={0} n={0} />
      {MACHINES.map(([name, desc], i) => {
        const p = interpolate(frame, [from + i * 12, from + i * 12 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={name} style={{
            background: "#f6dfc4", borderRadius: 10, margin: "8px 14px", padding: "10px 14px",
            position: "relative", top: (1 - p) * 26, opacity: p,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 17, background: ORANGE, color: "#fff", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#7a4a12", fontSize: 15, fontWeight: 800 }}>{name}挑戰</div>
              <div style={{ color: "#9a7748", fontSize: 11 }}>{desc}・完成後掃描機台 QR 記錄進度</div>
            </div>
            <div style={{ background: ORANGE, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 12, padding: "4px 10px" }}>前往</div>
          </div>
        );
      })}
    </div>
  );
};

const MapScreen: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "#efe9df", fontFamily: FONT }}>
    <Header />
    <div style={{ color: "#7a4a12", fontSize: 14, fontWeight: 800, textAlign: "center", marginTop: 10, letterSpacing: 1 }}>組立工場練習所・五站位置</div>
    <Img src={staticFile(A("map.png"))} style={{ position: "absolute", top: 110, left: 8, width: 374, borderRadius: 10 }} />
  </div>
);

const ProgressScreen: React.FC<{ toast: boolean }> = ({ toast }) => (
  <div style={{ position: "absolute", inset: 0, background: CREAM, fontFamily: FONT }}>
    <Header />
    <Prog pct={60} n={3} />
    {MACHINES.map(([name], i) => (
      <div key={name} style={{ background: "#fff", borderRadius: 10, margin: "7px 14px", padding: "9px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: i < 3 ? "#35a06f" : "#ddd", color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i < 3 ? "✓" : i + 1}</div>
        <div style={{ color: i < 3 ? "#35a06f" : "#999", fontSize: 15, fontWeight: 700 }}>{name}挑戰{i < 3 ? "・完成" : ""}</div>
      </div>
    ))}
    {toast && (
      <div style={{ position: "absolute", left: "50%", bottom: 120, transform: "translateX(-50%)", background: "#35a06f", color: "#fff", fontSize: 14, fontWeight: 700, borderRadius: 20, padding: "8px 18px", boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}>
        ✓ 已掃描・進度已記錄
      </div>
    )}
  </div>
);

const DoneScreen: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: CREAM, fontFamily: FONT }}>
    <Header />
    <Prog pct={100} n={5} />
    <div style={{ background: "#fff", borderRadius: 12, margin: "10px 14px", padding: "14px 16px", textAlign: "center" }}>
      <div style={{ color: "#35a06f", fontSize: 18, fontWeight: 800 }}>五項任務完成・結業證書已產生</div>
      <Img src={staticFile(A("cert_filled.png"))} style={{ width: 300, borderRadius: 6, marginTop: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }} />
      <div style={{ background: "#c9a227", color: "#fff", fontSize: 15, fontWeight: 800, borderRadius: 22, padding: "9px 0", marginTop: 12, letterSpacing: 2 }}>下載結業證書</div>
    </div>
  </div>
);

// ── 直式機台背景（contain 置左，避免 cover 裁掉機台）──
const KioskBg: React.FC<{ src: string; inAt: number }> = ({ src, inAt }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [inAt, inAt + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0f12", opacity: p }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: "6%", top: 0, height: "100%", objectFit: "contain" }} />
    </div>
  );
};

const QuestBackground: React.FC<{ T: Timing }> = ({ T }) => {
  const frame = useCurrentFrame();
  const hallScale = interpolate(frame, [0, T.playBg], [1.04, 1.12]);
  const playIn = interpolate(frame, [T.playBg, T.playBg + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>
    {frame < T.playBg + 8 && <Img src={staticFile(A("scene_hall.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${hallScale})` }} />}
    {frame >= T.playBg && frame < T.drillBg && (
      <div style={{ position: "absolute", inset: 0, opacity: playIn }}>
        <Img src={staticFile(A("scene_play.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    {frame >= T.drillBg && frame < T.certBg && <KioskBg src={A("kiosk_drill.png")} inAt={T.drillBg} />}
    {frame >= T.certBg && <KioskBg src={A("kiosk_cert.png")} inAt={T.certBg} />}
    <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${frame >= T.playBg ? 0.25 : 0})` }} />
  </>;
};

export const QuestDemo: React.FC<QuestDemoProps> = ({ 時間軸, 文案 }) => {
  const frame = useCurrentFrame();
  const T = toT(時間軸);
  // 黑幕須在書擋標題出現前收滿（書擋/落款皆在全黑上呈現）
  const fade = interpolate(frame, [T.fadeOut, T.bookendAt + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <QuestBackground T={T} />

      {/* 段1 標示卡 */}
      <Sequence from={0} durationInFrames={T.listStart}>
        <TitleCard index={4} title={文案.標題} subtitle={文案.副標} enterFrame={10} />
      </Sequence>
      <Sequence from={T.drillBg} durationInFrames={T.progAt - T.drillBg}>
        <SceneQrCallout src={A("qr_quest_gold.png")} enterFrame={4} target={SCENE_QR}
          card={{ x: 70, y: 300, width: 240 }} />
      </Sequence>

      {/* 手機全程在面板內；拉線僅於機台掃描段顯示 */}
      <PhoneBubble anchor={SCENE_QR} visibleFrom={T.phoneIn} visibleTo={T.fadeOut}
        leaderWindow={{ from: T.drillBg, to: T.progAt + 10 }}>
        {frame >= T.phoneIn - 5 && (
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={T.phoneIn} left={-76} top={10}>
            {frame < T.listStart && <TaskHome />}
            {frame >= T.listStart && frame < T.mapStart && <TaskList from={T.listStart + 4} />}
            {frame >= T.mapStart && frame < T.drillBg && <MapScreen />}
            {frame >= T.drillBg && frame < T.progAt && <ScanView bg={A("scan_panel.png")} from={T.drillBg + 5} to={T.progAt} qr={SCAN_QR} scanLabel={文案.掃描中標語} doneLabel={文案.掃描完成標語} />}
            {frame >= T.progAt && frame < T.doneAt && <ProgressScreen toast={frame < T.progAt + 70} />}
            {frame >= T.doneAt && <DoneScreen />}
          </PhoneAssetFrame>
        )}
      </PhoneBubble>

      {/* 字幕 */}
      <Subtitle lines={文案.字幕.map((l) => ({ text: l.文字, from: l.起, to: l.訖 }))} />

      {/* 結尾淡出 → 書擋標題卡（同開場） → 落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <BookendTitle from={T.bookendAt} to={T.endCardAt} />
      {frame >= T.endCardAt && (
        <div style={{ position: "absolute", inset: 0, opacity: interpolate(frame, [T.endCardAt, T.endCardAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <EndCard feature={文案.落款} index={4} fade={1} isFinal />
        </div>
      )}
    </AbsoluteFill>
  );
};
