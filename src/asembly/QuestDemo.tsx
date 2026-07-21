import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { EndCard, FONT, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ 每日任務示範（組立工場練習所）──CDIC_O4 式軌道制：Sequence 名＝props 欄名 ═══
// 腳本：PO 每日任務_W0710 pptx 五拍——開場任務頁→五機具列表→地圖→遊玩+掃機台QR記進度→完玩領證書
// 本片無旁白；以字幕串接五段功能敘事
const 軌 = (開始: number, 結束: number, 說明: string) =>
  z.object({
    開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
    結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
  }).default({ 開始, 結束 });
const 字幕列 = z.object({ 文字: z.string(), 起: z.number().int().min(0).max(3000), 訖: z.number().int().min(0).max(3000) });

export const questDemoSchema = z.object({
  時間軸: z.object({
    大廳場景: 軌(0, 180, "背景：練習所大廳渲染"),
    遊玩場景: 軌(180, 230, "背景：遊玩實照"),
    鑽削機台: 軌(230, 350, "背景：鑽削機台（掃 QR 段）"),
    證書機台: 軌(350, 456, "背景：證書機台"),
    標題段: 軌(0, 60, "左上功能標示卡顯示窗"),
    機台QR示意: 軌(230, 285, "左側金色 QR 示意卡＋拉線顯示窗"),
    手機面板: 軌(20, 456, "拉出面板＋手持手機在場窗"),
    任務頁: 軌(20, 60, "手機：今日任務首頁"),
    清單頁: 軌(60, 150, "手機：五機具清單"),
    地圖頁: 軌(150, 230, "手機：練習所地圖"),
    掃描畫面: 軌(230, 285, "手機：相機掃機台 QR"),
    進度頁: 軌(285, 360, "手機：進度 3/5＋已記錄提示"),
    完成頁: 軌(360, 456, "手機：5/5 完成領證書"),
    黑幕收尾: 軌(456, 600, "黑幕淡入後持續至片尾"),
    書擋標題: 軌(464, 546, "開頭標題卡同款書擋幀"),
    落款: 軌(546, 600, "結尾落款；結束幀＝影片總長"),
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

type Track = { 開始: number; 結束: number };
const durT = (t: Track) => t.結束 - t.開始;

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

export const QuestDemo: React.FC<QuestDemoProps> = ({ 時間軸: T, 文案 }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  // 黑幕須在書擋標題出現前收滿（書擋/落款皆在全黑上呈現）
  const fade = interpolate(frame, [T.黑幕收尾.開始, T.書擋標題.開始 + 4], [0, 1], clamp);
  const hallScale = interpolate(frame, [T.大廳場景.開始, T.大廳場景.結束], [1.04, 1.12]);
  const playIn = interpolate(frame, [T.遊玩場景.開始, T.遊玩場景.開始 + 8], [0, 1], clamp);
  const 手機起 = T.手機面板.開始;

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* 背景四軌 */}
      <Sequence name="大廳場景" from={T.大廳場景.開始} durationInFrames={durT(T.大廳場景) + 8}>
        <Img src={staticFile(A("scene_hall.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${hallScale})` }} />
      </Sequence>
      <Sequence name="遊玩場景" from={T.遊玩場景.開始} durationInFrames={durT(T.遊玩場景)}>
        <div style={{ position: "absolute", inset: 0, opacity: playIn }}>
          <Img src={staticFile(A("scene_play.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,14,0.25)" }} />
      </Sequence>
      <Sequence name="鑽削機台" from={T.鑽削機台.開始} durationInFrames={durT(T.鑽削機台)}>
        <KioskBg src={A("kiosk_drill.png")} inAt={0} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,14,0.25)" }} />
      </Sequence>
      <Sequence name="證書機台" from={T.證書機台.開始} durationInFrames={durT(T.證書機台)}>
        <KioskBg src={A("kiosk_cert.png")} inAt={0} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,14,0.25)" }} />
      </Sequence>

      <Sequence name="標題段" from={T.標題段.開始} durationInFrames={durT(T.標題段)}>
        <TitleCard index={4} title={文案.標題} subtitle={文案.副標} enterFrame={10} />
      </Sequence>
      <Sequence name="機台QR示意" from={T.機台QR示意.開始} durationInFrames={durT(T.機台QR示意)}>
        <SceneQrCallout src={A("qr_quest_gold.png")} enterFrame={4} target={SCENE_QR}
          card={{ x: 70, y: 300, width: 240 }} />
      </Sequence>

      {/* 手機面板：六個 App 畫面軌巢狀其中；拉線僅於機台QR示意窗顯示 */}
      <Sequence name="手機面板" from={T.手機面板.開始} durationInFrames={durT(T.手機面板)}>
        <PhoneBubble anchor={SCENE_QR} visibleFrom={0} visibleTo={durT(T.手機面板)}
          leaderWindow={{ from: T.機台QR示意.開始 - 手機起, to: T.機台QR示意.結束 + 10 - 手機起 }}>
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={0} left={-76} top={10}>
            <Sequence name="任務頁" from={T.任務頁.開始 - 手機起} durationInFrames={durT(T.任務頁)}><TaskHome /></Sequence>
            <Sequence name="清單頁" from={T.清單頁.開始 - 手機起} durationInFrames={durT(T.清單頁)}><TaskList from={4} /></Sequence>
            <Sequence name="地圖頁" from={T.地圖頁.開始 - 手機起} durationInFrames={durT(T.地圖頁)}><MapScreen /></Sequence>
            <Sequence name="掃描畫面" from={T.掃描畫面.開始 - 手機起} durationInFrames={durT(T.掃描畫面)}>
              <ScanView bg={A("scan_panel.png")} from={5} to={durT(T.掃描畫面)} qr={SCAN_QR} scanLabel={文案.掃描中標語} doneLabel={文案.掃描完成標語} />
            </Sequence>
            <Sequence name="進度頁" from={T.進度頁.開始 - 手機起} durationInFrames={durT(T.進度頁)}><ProgToast /></Sequence>
            <Sequence name="完成頁" from={T.完成頁.開始 - 手機起} durationInFrames={durT(T.完成頁)}><DoneScreen /></Sequence>
          </PhoneAssetFrame>
        </PhoneBubble>
      </Sequence>

      <Sequence name="字幕" from={0} durationInFrames={T.黑幕收尾.開始}>
        <Subtitle lines={文案.字幕.map((l) => ({ text: l.文字, from: l.起, to: l.訖 }))} />
      </Sequence>

      {/* 結尾：黑幕收滿 → 書擋標題卡（同開場） → 落款 */}
      <Sequence name="黑幕收尾" from={T.黑幕收尾.開始} durationInFrames={durT(T.黑幕收尾)}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      </Sequence>
      <Sequence name="書擋標題" from={T.書擋標題.開始} durationInFrames={durT(T.書擋標題)}>
        <BookendTitle from={0} to={durT(T.書擋標題)} />
      </Sequence>
      <Sequence name="落款" from={T.落款.開始} durationInFrames={durT(T.落款)}>
        <div style={{ position: "absolute", inset: 0, opacity: interpolate(frame, [T.落款.開始, T.落款.開始 + 12], [0, 1], clamp) }}>
          <EndCard feature={文案.落款} index={4} fade={1} isFinal />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// 進度頁＋前 70 幀「已記錄」提示（Sequence 內相對幀）
const ProgToast: React.FC = () => {
  const frame = useCurrentFrame();
  return <ProgressScreen toast={frame < 70} />;
};
