import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FingerTap, FONT, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, InfoCardRun, TitleCard } from "./shared";

// ═══ 每日任務示範（組立工場練習所）──CDIC_O4 式軌道制：Sequence 名＝props 欄名 ═══
// 腳本：PO 每日任務_W0710 pptx 五拍——開場任務頁→五機具列表→地圖→遊玩+掃機台QR記進度→完玩領證書
// 本片無旁白；以說明卡串接五段功能敘事
const 軌 = (開始: number, 結束: number, 說明: string) =>
  z.object({
    開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
    結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
  }).default({ 開始, 結束 });
const 說明卡列 = z.object({ 文字: z.string(), 起: z.number().int().min(0).max(3000), 訖: z.number().int().min(0).max(3000) });

export const questDemoSchema = z.object({
  時間軸: z.object({
    遊玩場景: 軌(0, 140, "背景：五座機具遊玩實照（先玩）"),
    鑽削機台: 軌(140, 500, "背景：進入鑽床遊玩→掃 QR→任務說明→進度"),
    補充場景: 軌(500, 630, "背景：大廳（直接開 App＋任務地圖）"),
    證書機台: 軌(630, 750, "背景：證書機台（下載證書）"),
    標題段: 軌(0, 60, "左上功能標示卡顯示窗"),
    機台QR示意: 軌(220, 280, "左側金色 QR 示意卡＋拉線顯示窗（玩完提示掃碼）"),
    證書QR示意: 軌(630, 750, "圈出證書機台 QR＋下載說明"),
    手機面板: 軌(232, 750, "拉出面板＋手持手機在場窗（掃碼起）"),
    掃描畫面: 軌(240, 280, "手機：相機掃機台 QR"),
    任務說明頁: 軌(280, 370, "手機：本日任務說明＋完成獎勵＋選擇參加"),
    參加點按: 軌(330, 368, "手指點「參加任務」（點按於開始+20 幀）"),
    進度頁: 軌(370, 500, "手機：參加後進度記錄更新"),
    清單頁: 軌(500, 540, "手機：任務清單（補充：直接開 App 接任務）"),
    地圖頁: 軌(540, 630, "手機：任務所在地圖"),
    完成頁: 軌(630, 750, "手機：5/5 完成＋下載證書"),
    黑幕收尾: 軌(750, 774, "黑幕淡入後持續至片尾；結束幀＝影片總長"),
  }),
  文案: z.object({
    標題: z.string().default("每日任務"),
    副標: z.string().default("現場遊玩或開啟 App 皆可參加"),
    掃描中標語: z.string().default("相機・對準機台 QR"),
    掃描完成標語: z.string().default("✓ 已辨識・顯示本日任務"),
    參加按鈕: z.string().default("參加任務・記錄進度"),
    說明卡: z.array(說明卡列).default([
      { 文字: "組立工場練習所開放五座互動機具，可直接操作體驗。", 起: 60, 訖: 220 },
      { 文字: "完成操作後，機台提示掃描 QR code。", 起: 220, 訖: 300 },
      { 文字: "掃描後顯示本日任務與完成獎勵，可選擇參加並記錄進度。", 起: 300, 訖: 370 },
      { 文字: "完成各機台後進度自動更新，五項完成產生結業證書。", 起: 370, 訖: 500 },
      { 文字: "也可直接開啟 App 每日任務，接下本日任務。", 起: 500, 訖: 540 },
      { 文字: "任務地圖標示五座互動機具的位置。", 起: 540, 訖: 630 },
      { 文字: "掃描機台 QR code，即可下載結業證書，完成本日任務。", 起: 630, 訖: 750 },
    ]),
  }),
});
export type QuestDemoProps = z.infer<typeof questDemoSchema>;
export const questDemoDefaultProps: QuestDemoProps = questDemoSchema.parse({ 時間軸: {}, 文案: {} });

type Track = { 開始: number; 結束: number };
const durT = (t: Track) => t.結束 - t.開始;

const A = (p: string) => `asembly/quest/${p}`;
const SCENE_QR = { x: 563, y: 564, size: 52 };
const CERT_QR = { x: 658, y: 328, size: 110 };
const SCAN_QR = { x: 217, y: 603, size: 124 };
const ORANGE = "#e8862d";
const CREAM = "#faf7f2";

const QrCircle: React.FC<{ target: { x: number; y: number; size: number }; enterFrame: number }> = ({ target, enterFrame }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [enterFrame, enterFrame + 14], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <svg style={{ position: "absolute", inset: 0, opacity }} width={1920} height={1080}>
      <circle cx={target.x} cy={target.y} r={Math.max(24, target.size * 0.7)} fill="none" stroke="#fff" strokeWidth={4} />
    </svg>
  );
};

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

const TaskHome: React.FC<{ joinLabel?: string }> = ({ joinLabel }) => (
  <div style={{ position: "absolute", inset: 0, background: CREAM, fontFamily: FONT }}>
    <Header />
    <div style={{ background: "#fff", borderRadius: 12, margin: "12px 14px", padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ color: ORANGE, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>今日任務</div>
      <div style={{ color: "#2b2b2b", fontSize: 21, fontWeight: 800, marginTop: 6, lineHeight: 1.3 }}>成為組立工場技工！</div>
      <div style={{ color: ORANGE, fontSize: 14, fontWeight: 700, marginTop: 4 }}>前往組立工場練習所！</div>
      <div style={{ color: "#666", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
        學習車削、銑削、鑽削、搪削、鉋削五種工具，完成所有體驗就可領取結業證書！
      </div>
      <div style={{ background: "#fdf6ec", border: "1px solid #f0dcbe", borderRadius: 8, marginTop: 10, padding: "8px 12px", color: "#7a4a12", fontSize: 12.5, lineHeight: 1.6 }}>
        完成獎勵：專屬「技工結業證書」（可下載保存）
      </div>
    </div>
    <Prog pct={0} n={0} />
    {joinLabel && (
      <div style={{ margin: "16px 14px 0", background: ORANGE, color: "#fff", fontSize: 16, fontWeight: 800, borderRadius: 24, padding: "13px 0", textAlign: "center", letterSpacing: 2, boxShadow: "0 4px 14px rgba(232,134,45,0.4)" }}>
        {joinLabel}
      </div>
    )}
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
const KioskBg: React.FC<{ src: string; inAt: number; fit?: "contain" | "cover" }> = ({ src, inAt, fit = "contain" }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [inAt, inAt + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0f12", opacity: p }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: fit === "cover" ? 0 : "6%", top: 0, width: fit === "cover" ? "100%" : undefined, height: "100%", objectFit: fit }} />
    </div>
  );
};

export const QuestDemo: React.FC<QuestDemoProps> = ({ 時間軸: T, 文案 }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  const fade = interpolate(frame, [T.黑幕收尾.開始, T.黑幕收尾.開始 + 12], [0, 1], clamp);
  const playIn = T.遊玩場景.開始 <= 0
    ? 1
    : interpolate(frame, [T.遊玩場景.開始, T.遊玩場景.開始 + 8], [0, 1], clamp);
  const 手機起 = T.手機面板.開始;

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* 背景軌 */}
      <Sequence name="遊玩場景" from={T.遊玩場景.開始} durationInFrames={durT(T.遊玩場景)}>
        <div style={{ position: "absolute", inset: 0, opacity: playIn }}>
          <Img src={staticFile(A("scene_play.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,14,0.25)" }} />
      </Sequence>
      <Sequence name="鑽削機台" from={T.鑽削機台.開始} durationInFrames={durT(T.鑽削機台)}>
        <KioskBg src={A("kiosk_drill.png")} inAt={0} fit="cover" />
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,14,0.25)" }} />
      </Sequence>
      <Sequence name="補充場景" from={T.補充場景.開始} durationInFrames={durT(T.補充場景)}>
        <Img src={staticFile(A("scene_hall.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.08)" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,14,0.25)" }} />
      </Sequence>
      <Sequence name="證書機台" from={T.證書機台.開始} durationInFrames={durT(T.證書機台)}>
        <KioskBg src={A("kiosk_cert.png")} inAt={0} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,14,0.25)" }} />
      </Sequence>

      <Sequence name="標題段" from={T.標題段.開始} durationInFrames={durT(T.標題段)}>
        <TitleCard index={4} title={文案.標題} subtitle={文案.副標} enterFrame={0} />
      </Sequence>
      <Sequence name="機台QR示意" from={T.機台QR示意.開始} durationInFrames={durT(T.機台QR示意)}>
        <SceneQrCallout src={A("qr_quest_gold.png")} enterFrame={4} target={SCENE_QR}
          card={{ x: 70, y: 300, width: 240 }} />
      </Sequence>
      <Sequence name="證書QR示意" from={T.證書QR示意.開始} durationInFrames={durT(T.證書QR示意)}>
        <QrCircle target={CERT_QR} enterFrame={4} />
      </Sequence>

      {/* 手機面板：六個 App 畫面軌巢狀其中；拉線僅於機台QR示意窗顯示 */}
      <Sequence name="手機面板" from={T.手機面板.開始} durationInFrames={durT(T.手機面板)}>
        <PhoneBubble anchor={SCENE_QR} visibleFrom={0} visibleTo={durT(T.手機面板)}
          leaderWindow={{ from: T.機台QR示意.開始 - 手機起, to: T.機台QR示意.結束 + 10 - 手機起 }}>
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={0} left={-76} top={10}
            overlay={<FingerTap src="asembly/airraid/finger_tap_po.png" tip={[881, 161]} imgSize={1024} scale={0.87}
              target={[376, 462]} start={T.參加點按.開始 - 手機起} tapAt={T.參加點按.開始 + 20 - 手機起} end={T.參加點按.結束 - 手機起} from={[-560, 500]} />}>
            <Sequence name="掃描畫面" from={T.掃描畫面.開始 - 手機起} durationInFrames={durT(T.掃描畫面)}>
              <ScanView bg={A("scan_panel.png")} from={5} to={durT(T.掃描畫面)} qr={SCAN_QR} scanLabel={文案.掃描中標語} doneLabel={文案.掃描完成標語} />
            </Sequence>
            <Sequence name="任務說明頁" from={T.任務說明頁.開始 - 手機起} durationInFrames={durT(T.任務說明頁)}>
              <TaskHome joinLabel={文案.參加按鈕} />
            </Sequence>
            <Sequence name="進度頁" from={T.進度頁.開始 - 手機起} durationInFrames={durT(T.進度頁)}><ProgToast /></Sequence>
            <Sequence name="清單頁" from={T.清單頁.開始 - 手機起} durationInFrames={durT(T.清單頁)}><TaskList from={4} /></Sequence>
            <Sequence name="地圖頁" from={T.地圖頁.開始 - 手機起} durationInFrames={durT(T.地圖頁)}><MapScreen /></Sequence>
            <Sequence name="完成頁" from={T.完成頁.開始 - 手機起} durationInFrames={durT(T.完成頁)}><DoneScreen /></Sequence>
          </PhoneAssetFrame>
        </PhoneBubble>
      </Sequence>

      <Sequence name="說明卡" from={0} durationInFrames={T.黑幕收尾.開始}>
        <InfoCardRun lines={文案.說明卡.map((l) => ({ text: l.文字, from: l.起, to: l.訖 }))} />
      </Sequence>

      {/* 結尾僅保留黑幕，不顯示說明卡。 */}
      <Sequence name="黑幕收尾" from={T.黑幕收尾.開始} durationInFrames={durT(T.黑幕收尾)}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      </Sequence>
    </AbsoluteFill>
  );
};

// 進度頁＋前 70 幀「已記錄」提示（Sequence 內相對幀）
const ProgToast: React.FC = () => {
  const frame = useCurrentFrame();
  return <ProgressScreen toast={frame < 70} />;
};
