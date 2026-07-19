import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, PhoneFrame, Subtitle, TitleCard } from "./shared";

// ═══ 每日任務示範（組立工場練習所）──30fps，總長 26s＝780f ═══
// 腳本：PO 每日任務_W0710 pptx 五拍——開場任務頁→五機具列表→地圖→遊玩+掃機台QR記進度→完玩領證書
// 旁白 YunJhe -8%/-4Hz：q1=3.98s q2=7.54s q3=5.50s q4=5.83s
const T = {
  phoneIn: 60,       // 訪客打開手機（開場即進任務頁，本片不掃碼開場）
  listStart: 140,    // 五機具卡陸續滑入
  mapStart: 260,     // 地圖頁
  playBg: 300,       // 背景切遊玩照片
  drillBg: 380,      // 背景切鑽削挑戰機台（畫面含 QR）
  progAt: 410,       // 掃描登入→進度 3/5
  certBg: 555,       // 背景切證書機台（畫面含 QR）
  doneAt: 565,       // 手機 5/5 完成+證書
  fadeOut: 756,
  total: 780,
};
const VO = { q1: 9, q2: 140, q3: 380, q4: 560 };

const A = (p: string) => `asembly/quest/${p}`;
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
      <div style={{ color: "#35a06f", fontSize: 18, fontWeight: 800 }}>恭喜畢業！五項挑戰全數完成</div>
      <Img src={staticFile(A("cert_paper.png"))} style={{ width: 300, borderRadius: 6, marginTop: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }} />
      <div style={{ background: "#c9a227", color: "#fff", fontSize: 15, fontWeight: 800, borderRadius: 22, padding: "9px 0", marginTop: 12, letterSpacing: 2 }}>領取結業證書</div>
    </div>
  </div>
);

// ── 直式機台背景（contain 置左，避免 cover 裁掉機台）──
const KioskBg: React.FC<{ src: string; inAt: number }> = ({ src, inAt }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [inAt, inAt + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0f12", opacity: p }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: "6%", top: 0, height: "100%", objectFit: "contain" }} />
    </div>
  );
};

export const QuestDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const hallScale = interpolate(frame, [0, T.playBg], [1.04, 1.12]);
  const playIn = interpolate(frame, [T.playBg, T.playBg + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* 背景四幕：練習所大廳→遊玩照→鑽削機台(含QR)→證書機台(含QR) */}
      {frame < T.playBg + 14 && (
        <Img src={staticFile(A("scene_hall.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${hallScale})` }} />
      )}
      {frame >= T.playBg && frame < T.drillBg && (
        <div style={{ position: "absolute", inset: 0, opacity: playIn }}>
          <Img src={staticFile(A("scene_play.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      {frame >= T.drillBg && frame < T.certBg && <KioskBg src={A("kiosk_drill.png")} inAt={T.drillBg} />}
      {frame >= T.certBg && <KioskBg src={A("kiosk_cert.png")} inAt={T.certBg} />}
      <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${frame >= T.playBg ? 0.25 : 0})` }} />

      {/* 段1 標示卡 */}
      <Sequence from={0} durationInFrames={T.listStart}>
        <TitleCard title="每日任務" subtitle="成為組立工場技工——組立工場練習所" enterFrame={10} />
      </Sequence>

      {/* 手機（全程手持；本片開場即開手機，不掃碼進入） */}
      {frame >= T.phoneIn - 5 && (
        <PhoneFrame enterFrame={T.phoneIn} x={380} hand={A("hand_hold.png")}>
          {frame < T.listStart && <TaskHome />}
          {frame >= T.listStart && frame < T.mapStart && <TaskList from={T.listStart + 4} />}
          {frame >= T.mapStart && frame < T.progAt && <MapScreen />}
          {frame >= T.progAt && frame < T.doneAt && <ProgressScreen toast={frame < T.progAt + 70} />}
          {frame >= T.doneAt && <DoneScreen />}
        </PhoneFrame>
      )}

      {/* 旁白 */}
      <Sequence from={VO.q1}><Audio src={staticFile(A("vo_q1.mp3"))} /></Sequence>
      <Sequence from={VO.q2}><Audio src={staticFile(A("vo_q2.mp3"))} /></Sequence>
      <Sequence from={VO.q3}><Audio src={staticFile(A("vo_q3.mp3"))} /></Sequence>
      <Sequence from={VO.q4}><Audio src={staticFile(A("vo_q4.mp3"))} /></Sequence>

      {/* 字幕 */}
      <Subtitle lines={[
        { text: "今天的任務——成為組立工場的技工！", from: VO.q1, to: 133 },
        { text: "車、銑、鑽、搪、鉋，五種功夫，跟著地圖一關一關來。", from: VO.q2, to: 370 },
        { text: "每過一關，掃一下機台上的 QR code，進度幫你記著。", from: VO.q3, to: 550 },
        { text: "五關全過，結業證書領回家——恭喜畢業！", from: VO.q4, to: 740 },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      {fade > 0.6 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: (fade - 0.6) / 0.4 }}>
          <div style={{ color: "#e8ecf2", fontSize: 34, letterSpacing: 6, fontWeight: 600 }}>組立工場行動導覽・每日任務</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
