import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { EndCard, FingerTap, FONT, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ AR 導覽功能示範（G-1-3 機坑×台工1677）──時間軸與文案由 props 控制（Studio 右欄可調）═══
// 空間圖：PO 提供 G-3-機坑三連（scene1 亮景全景→scene2 訪客舉手機→scene3 調暗＋說明牌 QR 聚光）
// 本片無旁白；字幕逐句可改文字與起訖幀
const 幀 = (預設: number, 說明: string) => z.number().int().min(0).max(3000).default(預設).describe(說明);
const 字幕列 = z.object({ 文字: z.string(), 起: z.number().int().min(0).max(3000), 訖: z.number().int().min(0).max(3000) });

export const arDemoSchema = z.object({
  時間軸: z.object({
    場景2切換: 幀(30, "訪客舉手機中景進入幀"),
    場景3切換: 幀(44, "暗景聚光近景進入幀"),
    手機進場: 幀(58, "拉出面板＋手機出現幀"),
    標示卡結束: 幀(72, "左上功能標示卡消失幀"),
    掃描結束: 幀(120, "掃描完成→AR 分頁"),
    點按AR: 幀(260, "手指點按 AR 按鈕幀（重現動畫緊隨其後）"),
    淡出開始: 幀(426, "結尾黑幕淡出起點"),
    總長: 幀(450, "影片總長（幀，30fps）"),
  }),
  文案: z.object({
    標題: z.string().default("AR 探索"),
    副標: z.string().default("掃描展板 QR，在原址疊合機具歷史影像"),
    掃描完成標語: z.string().default("✓ 已辨識・開啟 AR 探索"),
    落款: z.string().default("AR 於展項原址呈現機具影像"),
    字幕: z.array(字幕列).default([
      { 文字: "掃描展板 QR，開啟 AR 模式。", 起: 80, 訖: 150 },
      { 文字: "系統辨識展項位置與台工 1677 機具資料。", 起: 150, 訖: 230 },
      { 文字: "點選畫面按鈕，在機坑原址疊合機具影像。", 起: 230, 訖: 330 },
      { 文字: "畫面可對照機坑現況與機具原貌。", 起: 330, 訖: 420 },
    ]),
  }),
});
export type ARDemoProps = z.infer<typeof arDemoSchema>;
export const arDemoDefaultProps: ARDemoProps = arDemoSchema.parse({ 時間軸: {}, 文案: {} });

type Timing = { s2aStart: number; s2bStart: number; phoneIn: number; functionStart: number; scanEnd: number; arTap: number; arReveal: number; fadeOut: number; total: number };
const toT = (t: ARDemoProps["時間軸"]): Timing => ({
  s2aStart: t.場景2切換, s2bStart: t.場景3切換, phoneIn: t.手機進場, functionStart: t.標示卡結束,
  scanEnd: t.掃描結束, arTap: t.點按AR, arReveal: t.點按AR + 7, fadeOut: t.淡出開始, total: t.總長,
});

const A = (p: string) => `asembly/ardemo/${p}`;
// v7 實圖量測：橘色 AR QR；面板旁另有綠色語音 QR，勿圈錯。
const SCENE_QR = { x: 608, y: 532, size: 14 };
const SCAN_QR = { x: 176, y: 529, size: 107 };
const SPOT3 = { x: "12.3%", y: "50.9%" };
const PHONE_ANCHOR = { x: 236, y: 550 };

const ARBackground: React.FC<{ T: Timing }> = ({ T }) => {
  const frame = useCurrentFrame();
  const s1Scale = interpolate(frame, [0, T.s2aStart + 8], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.s2aStart, T.s2aStart + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s2Scale = interpolate(frame, [T.s2aStart, T.s2bStart + 8], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const in3 = interpolate(frame, [T.s2bStart, T.s2bStart + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push3 = interpolate(frame, [T.s2bStart, T.scanEnd + 20], [1.02, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgDim = interpolate(frame, [T.scanEnd - 10, T.scanEnd + 20], [0, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>
    {frame < T.s2aStart + 8 && <Img src={staticFile(A("scene1_G13.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />}
    {frame >= T.s2aStart && frame < T.s2bStart + 8 && (
      <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${s2Scale})` }}>
        <Img src={staticFile(A("scene2_G13.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    {frame >= T.s2bStart && (
      <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
        <Img src={staticFile(A("scene3_G13_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />
  </>;
};

export const ARDemo: React.FC<ARDemoProps> = ({ 時間軸, 文案 }) => {
  const frame = useCurrentFrame();
  const T = toT(時間軸);
  const revealP = interpolate(frame, [T.arReveal - 4, T.arReveal + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <ARBackground T={T} />

      {/* 段1 覆蓋層：功能標示卡＋左側 QR 放大示意 */}
      <Sequence from={0} durationInFrames={T.functionStart}>
        <TitleCard index={2} title={文案.標題} subtitle={文案.副標} enterFrame={5} />
      </Sequence>
      <Sequence from={0} durationInFrames={T.s2aStart}>
        <SceneQrCallout src={A("qr_ar_G13_labeled.png")} enterFrame={15} target={SCENE_QR}
          backgroundScale={interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12])} />
      </Sequence>

      {/* 拉出面板（不能包 Sequence，否則子元件幀號變相對值）：掃描→AR 分頁→點按→台工1677 重現 */}
      <PhoneBubble anchor={PHONE_ANCHOR} visibleFrom={T.phoneIn} visibleTo={T.fadeOut}>
        {/* PO 手部素材（hand_po 挖空版）：slab 置中面板、手腕自面板底右裁出；素材位置＝面板相對座標 */}
        {frame >= T.phoneIn - 5 && (
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={T.phoneIn} left={-76} top={10}
            overlay={<FingerTap src={A("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={0.87}
              target={[381, 712]} start={T.arTap - 30} tapAt={T.arTap} end={T.arTap + 44} from={[-560, 500]} />}>
            {frame < T.scanEnd && <ScanView bg={A("scan_panel.png")} from={T.phoneIn + 10} to={T.scanEnd} qr={SCAN_QR} doneLabel={文案.掃描完成標語} />}
            {frame >= T.scanEnd && (
              <>
                <Img src={staticFile(A("app_ar_before.png"))} style={{ position: "absolute", width: "100%", opacity: 1 - revealP }} />
                <Img src={staticFile(A("app_ar_after.png"))} style={{ position: "absolute", width: "100%", opacity: revealP }} />
              </>
            )}
          </PhoneAssetFrame>
        )}
      </PhoneBubble>

      {/* 字幕 */}
      <Subtitle lines={文案.字幕.map((l) => ({ text: l.文字, from: l.起, to: l.訖 }))} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <EndCard feature={文案.落款} index={2} fade={fade} />
    </AbsoluteFill>
  );
};
