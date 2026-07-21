import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { EndCard, FingerTap, FONT, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ AR 導覽功能示範（G-1-3 機坑×台工1677）──CDIC_O4 式軌道制：Sequence 名＝props 欄名 ═══
// 本片無旁白；字幕逐句含起訖幀（絕對幀）
const 軌 = (開始: number, 結束: number, 說明: string) =>
  z.object({
    開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
    結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
  }).default({ 開始, 結束 });
const 字幕列 = z.object({ 文字: z.string(), 起: z.number().int().min(0).max(3000), 訖: z.number().int().min(0).max(3000) });

export const arDemoSchema = z.object({
  時間軸: z.object({
    亮景全景: 軌(0, 30, "背景：機坑亮景全景"),
    訪客中景: 軌(30, 44, "背景：訪客舉手機中景"),
    暗景聚光: 軌(44, 450, "背景：暗景聚光近景（其後持續）"),
    標題段: 軌(0, 72, "左上功能標示卡顯示窗"),
    開場QR示意: 軌(0, 30, "左側 QR 放大示意卡"),
    手機面板: 軌(58, 426, "拉出面板＋手持手機在場窗"),
    掃描畫面: 軌(68, 120, "手機內相機掃描畫面（結束＝切 AR 分頁）"),
    手指點按: 軌(230, 304, "手指滑入點 AR 鈕（點按於開始+30 幀；重現緊隨其後）"),
    黑幕淡出: 軌(426, 450, "結尾黑幕＋落款；結束幀＝影片總長"),
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

type Track = { 開始: number; 結束: number };
const dur = (t: Track) => t.結束 - t.開始;

const A = (p: string) => `asembly/ardemo/${p}`;
// v7 實圖量測：橘色 AR QR；面板旁另有綠色語音 QR，勿圈錯。
const SCENE_QR = { x: 608, y: 532, size: 14 };
const SCAN_QR = { x: 176, y: 529, size: 107 };
const SPOT3 = { x: "12.3%", y: "50.9%" };
const PHONE_ANCHOR = { x: 236, y: 550 };
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const ARDemo: React.FC<ARDemoProps> = ({ 時間軸: T, 文案 }) => {
  const frame = useCurrentFrame();
  const tapAt = T.手指點按.開始 + 30;
  const revealP = interpolate(frame, [tapAt + 3, tapAt + 17], [0, 1], clamp);
  const fade = interpolate(frame, [T.黑幕淡出.開始, T.黑幕淡出.結束 - 6], [0, 1], clamp);
  const s1Scale = interpolate(frame, [T.亮景全景.開始, T.亮景全景.結束 + 8], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.訪客中景.開始, T.訪客中景.開始 + 8], [0, 1], clamp);
  const s2Scale = interpolate(frame, [T.訪客中景.開始, T.訪客中景.結束 + 8], [1, 1.08], clamp);
  const in3 = interpolate(frame, [T.暗景聚光.開始, T.暗景聚光.開始 + 8], [0, 1], clamp);
  const push3 = interpolate(frame, [T.暗景聚光.開始, T.掃描畫面.結束 + 20], [1.02, 1.3], clamp);
  const bgDim = interpolate(frame, [T.掃描畫面.結束 - 10, T.掃描畫面.結束 + 20], [0, 0.25], clamp);
  const scanStartRel = T.掃描畫面.開始 - T.手機面板.開始;
  const tapRel = { start: T.手指點按.開始 - T.手機面板.開始, tapAt: tapAt - T.手機面板.開始, end: T.手指點按.結束 - T.手機面板.開始 };

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <Sequence name="亮景全景" from={T.亮景全景.開始} durationInFrames={dur(T.亮景全景) + 8}>
        <Img src={staticFile(A("scene1_G13.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />
      </Sequence>
      <Sequence name="訪客中景" from={T.訪客中景.開始} durationInFrames={dur(T.訪客中景) + 8}>
        <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${s2Scale})` }}>
          <Img src={staticFile(A("scene2_G13.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </Sequence>
      <Sequence name="暗景聚光" from={T.暗景聚光.開始} durationInFrames={dur(T.暗景聚光)}>
        <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
          <Img src={staticFile(A("scene3_G13_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />
      </Sequence>

      <Sequence name="標題段" from={T.標題段.開始} durationInFrames={dur(T.標題段)}>
        <TitleCard index={2} title={文案.標題} subtitle={文案.副標} enterFrame={5} />
      </Sequence>
      <Sequence name="開場QR示意" from={T.開場QR示意.開始} durationInFrames={dur(T.開場QR示意)}>
        <SceneQrCallout src={A("qr_ar_G13_labeled.png")} enterFrame={15} target={SCENE_QR} backgroundScale={s1Scale} />
      </Sequence>

      {/* 手機面板：掃描→AR 分頁→手指點按→台工1677 重現 */}
      <Sequence name="手機面板" from={T.手機面板.開始} durationInFrames={dur(T.手機面板)}>
        <PhoneBubble anchor={PHONE_ANCHOR} visibleFrom={0} visibleTo={dur(T.手機面板)}>
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={0} left={-76} top={10}
            overlay={<FingerTap src={A("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={0.87}
              target={[381, 712]} start={tapRel.start} tapAt={tapRel.tapAt} end={tapRel.end} from={[-560, 500]} />}>
            <Sequence name="掃描畫面" from={scanStartRel} durationInFrames={dur(T.掃描畫面)}>
              <ScanView bg={A("scan_panel.png")} from={10} to={dur(T.掃描畫面)} qr={SCAN_QR} doneLabel={文案.掃描完成標語} />
            </Sequence>
            <Sequence name="AR分頁" from={T.掃描畫面.結束 - T.手機面板.開始} durationInFrames={dur(T.手機面板) - (T.掃描畫面.結束 - T.手機面板.開始)}>
              <Img src={staticFile(A("app_ar_before.png"))} style={{ position: "absolute", width: "100%", opacity: 1 - revealP }} />
              <Img src={staticFile(A("app_ar_after.png"))} style={{ position: "absolute", width: "100%", opacity: revealP }} />
            </Sequence>
          </PhoneAssetFrame>
        </PhoneBubble>
      </Sequence>

      <Sequence name="字幕" from={0} durationInFrames={T.黑幕淡出.開始}>
        <Subtitle lines={文案.字幕.map((l) => ({ text: l.文字, from: l.起, to: l.訖 }))} />
      </Sequence>

      <Sequence name="黑幕淡出" from={T.黑幕淡出.開始} durationInFrames={dur(T.黑幕淡出)}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
        <EndCard feature={文案.落款} index={2} fade={fade} />
      </Sequence>
    </AbsoluteFill>
  );
};
