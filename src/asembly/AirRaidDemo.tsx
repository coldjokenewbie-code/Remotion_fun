import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { EndCard, FONT, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ 時間軸與文案改由 props 控制（Remotion Studio 右欄可直接調；預設值＝v8 定稿）═══
// 空間圖 v3（PO 提供 0B-7 展台渲染三連）：scene1 亮景全景 → scene2 暗景中景（QR 聚光）→ scene3 近景正視
// 開場靜音；旁白於「掃描結束」起播，字幕時間隨時間軸連動
const 幀 = (預設: number, 說明: string) => z.number().int().min(0).max(3000).default(預設).describe(說明);

export const airRaidSchema = z.object({
  時間軸: z.object({
    場景2切換: 幀(36, "暗景中景（QR 聚光）進入幀"),
    場景3切換: 幀(50, "近景正視進入幀"),
    手機進場: 幀(62, "拉出面板＋手機出現幀"),
    掃描結束: 幀(160, "掃描完成→App 分頁；中文旁白與字幕同時起播"),
    日文段開始: 幀(510, "切日文介面＋日文旁白／多語卡"),
    淡出開始: 幀(708, "結尾黑幕淡出起點"),
    總長: 幀(732, "影片總長（幀，30fps）"),
  }),
  文案: z.object({
    標題: z.string().default("語音導覽"),
    副標: z.string().default("掃描展板 QR，開啟該展項語音解說"),
    中文字幕: z.string().default("一九四四年空襲使桁架留下變形痕跡；操作望遠鏡對準屋架，即可辨識受損位置。"),
    日文字幕: z.string().default("1944年の空襲で変形した鉄骨を、望遠鏡型装置で確認できます。"),
    日文字幕中文小字: z.string().default("一九四四年空襲留下的桁架變形，可透過望遠鏡型裝置確認。"),
    多語卡標題: z.string().default("多語服務"),
    多語卡內容: z.string().default("同一展項支援中・英・日語音與介面切換"),
    落款: z.string().default("語音導覽與中・英・日多語服務"),
  }),
});
export type AirRaidProps = z.infer<typeof airRaidSchema>;
export const airRaidDefaultProps: AirRaidProps = airRaidSchema.parse({ 時間軸: {}, 文案: {} });

type Timing = { s2aStart: number; s2bStart: number; phoneIn: number; scanEnd: number; japaneseStart: number; fadeOut: number; total: number };
const toT = (t: AirRaidProps["時間軸"]): Timing => ({
  s2aStart: t.場景2切換, s2bStart: t.場景3切換, phoneIn: t.手機進場,
  scanEnd: t.掃描結束, japaneseStart: t.日文段開始, fadeOut: t.淡出開始, total: t.總長,
});

const A = (p: string) => `asembly/airraid/${p}`;
// 聚光點（PIL 亮度質心量測，objectFit cover 換算後畫布座標）
const SPOT2 = { x: "19.7%", y: "69.5%" }; // PO 2026-07-17 更新版 scene2（2047×1066）重量測
const SPOT3 = { x: "12.5%", y: "56%" };
// v7 實圖量測：scene1 cover 座標；scan_panel 為 480×1040 座標。
const SCENE_QR = { x: 653, y: 810, size: 16 };
// PO 設計稿 scan_screen_po.png（自帶相機 chip/取景框；真 QR 已原位合成 decode=0B-7?f=audio；
// 全寬保留、上下石板紋理延伸補至 390:844）
const SCAN_QR = { x: 125, y: 546, size: 133 };
// 段2 手機拉出示意：沿用 scene3 zoom transformOrigin（SPOT3，已量測之定點）換算絕對像素
const PHONE_ANCHOR = { x: 240, y: 605 };

const MultiLanguageCard: React.FC<{ at: number; title: string; body: string }> = ({ at, title, body }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at - 8, at + 6], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "absolute", left: 72, top: 300, width: 650, opacity, fontFamily: FONT,
      background: "rgba(15,18,25,0.86)", borderLeft: "6px solid #ff8a3d", borderRadius: 10,
      padding: "22px 28px", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
      <div style={{ color: "#ffad73", fontSize: 22, fontWeight: 800, letterSpacing: 4 }}>{title}</div>
      <div style={{ color: "#fff", fontSize: 30, fontWeight: 650, marginTop: 10 }}>{body}</div>
    </div>
  );
};

const AirRaidBackground: React.FC<{ T: Timing }> = ({ T }) => {
  const frame = useCurrentFrame();
  const s1Scale = interpolate(frame, [0, T.s2aStart + 8], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.s2aStart, T.s2aStart + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push2 = interpolate(frame, [T.s2aStart, T.s2bStart + 8], [1, 1.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const in3 = interpolate(frame, [T.s2bStart, T.s2bStart + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push3 = interpolate(frame, [T.s2bStart, T.scanEnd + 20], [1.05, 1.32], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgDim = interpolate(frame, [T.scanEnd - 10, T.scanEnd + 20], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>
    {frame < T.s2aStart + 8 && <Img src={staticFile(A("scene1_0B7.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />}
    {frame >= T.s2aStart && frame < T.s2bStart + 8 && (
      <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${push2})`, transformOrigin: `${SPOT2.x} ${SPOT2.y}` }}>
        <Img src={staticFile(A("scene2_0B7_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    {frame >= T.s2bStart && (
      <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
        <Img src={staticFile(A("scene3_0B7_close.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />
  </>;
};

export const AirRaidDemo: React.FC<AirRaidProps> = ({ 時間軸, 文案 }) => {
  const frame = useCurrentFrame();
  const T = toT(時間軸);
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <AirRaidBackground T={T} />

      {/* 段1 覆蓋層：功能標示卡＋左側 QR 放大示意（指向說明牌上的 QR） */}
      <Sequence from={0} durationInFrames={T.scanEnd}>
        <TitleCard index={1} title={文案.標題} subtitle={文案.副標} enterFrame={2} />
      </Sequence>
      <Sequence from={0} durationInFrames={T.s2aStart}>
        <SceneQrCallout src={A("qr_audio_0B7_labeled.png")} enterFrame={20} target={SCENE_QR}
          backgroundScale={interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12])} />
      </Sequence>

      {/* 拉出面板：掃碼＋語音導覽分頁（不能包 Sequence，否則子元件幀號變相對值） */}
      <PhoneBubble anchor={PHONE_ANCHOR} visibleFrom={T.phoneIn} visibleTo={T.fadeOut}>
        {frame >= T.phoneIn - 5 && (
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={T.phoneIn} left={-76} top={10}>
            {/* 掃描相機畫面（對準展台說明牌上的 QR） */}
            {frame < T.scanEnd && <ScanView bg={A("scan_screen_po.png")} from={T.phoneIn + 10} to={T.scanEnd} qr={SCAN_QR} chrome={false} />}
            {/* App 語音導覽分頁（原型實截：中文播放中） */}
            {frame >= T.scanEnd && (
              <Img src={staticFile(A(frame < T.japaneseStart ? "app_tw_play.png" : "app_jp_play.png"))} style={{ position: "absolute", width: "100%" }} />
            )}
          </PhoneAssetFrame>
        )}
      </PhoneBubble>

      {/* 功能旁白（開場段無音軌；起點隨「掃描結束」「日文段開始」連動） */}
      <Sequence from={T.scanEnd}><Audio src={staticFile(A("vo_airraid_guide_tw.mp3"))} /></Sequence>
      <Sequence from={T.japaneseStart}><Audio src={staticFile(A("vo_s3_ja_v2.mp3"))} /></Sequence>
      {frame >= T.japaneseStart - 8 && frame < T.fadeOut && (
        <MultiLanguageCard at={T.japaneseStart} title={文案.多語卡標題} body={文案.多語卡內容} />
      )}

      {/* 字幕（時間隨時間軸連動，只需改文字） */}
      <Subtitle lines={[
        { text: 文案.中文字幕, from: T.scanEnd, to: T.japaneseStart },
        { text: 文案.日文字幕, small: 文案.日文字幕中文小字, from: T.japaneseStart, to: T.fadeOut },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <EndCard feature={文案.落款} index={1} fade={fade} />
    </AbsoluteFill>
  );
};
