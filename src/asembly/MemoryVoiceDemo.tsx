import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { EndCard, FONT, InfoCard, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, TitleCard } from "./shared";

// ═══ 記憶中的聲音示範 v3（0B-3 職工的回憶）──CDIC_O4 式軌道制：Sequence 名＝props 欄名 ═══
// 掃描完成起播「人才培育.mp3」原始展示音檔（PO：音檔本身就是展示的一部分）
const 軌 = (開始: number, 結束: number, 說明: string) =>
  z.object({
    開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
    結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
  }).default({ 開始, 結束 });

export const memoryVoiceSchema = z.object({
  時間軸: z.object({
    亮景全景: 軌(0, 36, "背景：職工的回憶亮景"),
    訪客中景: 軌(36, 50, "背景：訪客舉手機中景"),
    暗景聚光: 軌(50, 600, "背景：暗景聚光（其後持續）"),
    標題段: 軌(0, 150, "左上功能標示卡顯示窗"),
    開場QR示意: 軌(0, 36, "左側 QR 放大示意卡"),
    手機面板: 軌(62, 574, "拉出面板＋手持手機在場窗"),
    掃描畫面: 軌(72, 150, "手機內相機掃描畫面（結束＝切記憶分頁）"),
    展示音檔: 軌(150, 574, "人才培育.mp3 播放窗（全長 21.5s，隨黑幕淡出）"),
    小標卡一: 軌(150, 410, "第一張小標字卡顯示窗"),
    小標卡二: 軌(410, 574, "第二張小標字卡顯示窗"),
    進度畫面: 軌(470, 574, "App 進度條 0:04 畫面顯示窗"),
    黑幕淡出: 軌(574, 600, "結尾黑幕＋落款；結束幀＝影片總長"),
  }),
  文案: z.object({
    標題: z.string().default("記憶中的聲音"),
    副標: z.string().default("掃描展板 QR，播放前輩口述與工作記憶"),
    掃描完成標語: z.string().default("✓ 已辨識・開啟記憶中的聲音"),
    小標卡一: z.string().default("掃描展板，可聆聽前輩口述；從工作與生活片段，保存工場記憶。"),
    小標卡二: z.string().default("1938 年，由臺北鐵道工技手新鄉重夫，"),
    落款: z.string().default("掃描展板 QR，播放前輩口述記憶"),
  }),
});
export type MemoryVoiceProps = z.infer<typeof memoryVoiceSchema>;
export const memoryVoiceDefaultProps: MemoryVoiceProps = memoryVoiceSchema.parse({ 時間軸: {}, 文案: {} });

type Track = { 開始: number; 結束: number };
const dur = (t: Track) => t.結束 - t.開始;

const A = (p: string) => `asembly/memory/${p}`;
const SCENE_QR = { x: 118, y: 376, size: 26 };
const SCAN_QR = { x: 241, y: 500, size: 131 };
const SPOT3 = { x: "6.4%", y: "42.8%" };
const PHONE_ANCHOR = { x: 123, y: 462 };
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const MemoryVoiceDemo: React.FC<MemoryVoiceProps> = ({ 時間軸: T, 文案 }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [T.黑幕淡出.開始, T.黑幕淡出.結束 - 6], [0, 1], clamp);
  const s1Scale = interpolate(frame, [T.亮景全景.開始, T.亮景全景.結束 + 8], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.訪客中景.開始, T.訪客中景.開始 + 8], [0, 1], clamp);
  const s2Scale = interpolate(frame, [T.訪客中景.開始, T.訪客中景.結束 + 8], [1, 1.08], clamp);
  const in3 = interpolate(frame, [T.暗景聚光.開始, T.暗景聚光.開始 + 8], [0, 1], clamp);
  const push3 = interpolate(frame, [T.暗景聚光.開始, T.掃描畫面.結束 + 20], [1.02, 1.3], clamp);
  const bgDim = interpolate(frame, [T.掃描畫面.結束 - 10, T.掃描畫面.結束 + 20], [0, 0.25], clamp);
  const audioFadeRel = T.黑幕淡出.開始 - T.展示音檔.開始;
  const progSwapRel = T.進度畫面.開始 - T.掃描畫面.結束; // 記憶分頁 Sequence 內相對幀

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <Sequence name="亮景全景" from={T.亮景全景.開始} durationInFrames={dur(T.亮景全景) + 8}>
        <Img src={staticFile(A("scene1_0B3.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />
      </Sequence>
      <Sequence name="訪客中景" from={T.訪客中景.開始} durationInFrames={dur(T.訪客中景) + 8}>
        <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${s2Scale})` }}>
          <Img src={staticFile(A("scene2_0B3.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </Sequence>
      <Sequence name="暗景聚光" from={T.暗景聚光.開始} durationInFrames={dur(T.暗景聚光)}>
        <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
          <Img src={staticFile(A("scene3_0B3_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />
      </Sequence>

      <Sequence name="標題段" from={T.標題段.開始} durationInFrames={dur(T.標題段)}>
        <TitleCard index={3} title={文案.標題} subtitle={文案.副標} enterFrame={2} />
      </Sequence>
      <Sequence name="開場QR示意" from={T.開場QR示意.開始} durationInFrames={dur(T.開場QR示意)}>
        <SceneQrCallout src={A("qr_memory_0B3_labeled.png")} enterFrame={20} target={SCENE_QR}
          backgroundScale={s1Scale} card={{ x: 200, y: 400, width: 320 }} />
      </Sequence>

      {/* 手機面板：掃描→記憶分頁（真實進度條 0:01→0:04） */}
      <Sequence name="手機面板" from={T.手機面板.開始} durationInFrames={dur(T.手機面板)}>
        <PhoneBubble anchor={PHONE_ANCHOR} visibleFrom={0} visibleTo={dur(T.手機面板)}>
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={0} left={-76} top={10}>
            <Sequence name="掃描畫面" from={T.掃描畫面.開始 - T.手機面板.開始} durationInFrames={dur(T.掃描畫面)}>
              <ScanView bg={A("scan_panel.png")} from={10} to={dur(T.掃描畫面)} qr={SCAN_QR} doneLabel={文案.掃描完成標語} />
            </Sequence>
            <Sequence name="記憶分頁" from={T.掃描畫面.結束 - T.手機面板.開始} durationInFrames={dur(T.手機面板) - (T.掃描畫面.結束 - T.手機面板.開始)}>
              <MemoryScreens progSwapRel={progSwapRel} />
            </Sequence>
          </PhoneAssetFrame>
        </PhoneBubble>
      </Sequence>

      {/* 展示音檔（人才培育原檔；隨黑幕淡出） */}
      <Sequence name="展示音檔" from={T.展示音檔.開始} durationInFrames={dur(T.展示音檔) + (T.黑幕淡出.結束 - T.黑幕淡出.開始)}>
        <Audio src={staticFile(A("vo_memory_full.mp3"))}
          volume={(f) => interpolate(f, [audioFadeRel - 6, audioFadeRel + 18], [1, 0], clamp)} />
      </Sequence>

      <Sequence name="小標卡一" from={T.小標卡一.開始} durationInFrames={dur(T.小標卡一)}>
        <InfoCard at={4} body={文案.小標卡一} />
      </Sequence>
      <Sequence name="小標卡二" from={T.小標卡二.開始} durationInFrames={dur(T.小標卡二)}>
        <InfoCard at={0} body={文案.小標卡二} />
      </Sequence>

      <Sequence name="黑幕淡出" from={T.黑幕淡出.開始} durationInFrames={dur(T.黑幕淡出)}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
        <EndCard feature={文案.落款} index={3} fade={fade} />
      </Sequence>
    </AbsoluteFill>
  );
};

// 記憶分頁：play1→play2（progSwapRel＝本 Sequence 內相對切換幀，對應「進度畫面.開始」）
const MemoryScreens: React.FC<{ progSwapRel: number }> = ({ progSwapRel }) => {
  const frame = useCurrentFrame();
  return <>
    <Img src={staticFile(A("app_memory_play1.png"))} style={{ position: "absolute", width: "100%", opacity: frame >= progSwapRel ? 0 : 1 }} />
    <Img src={staticFile(A("app_memory_play2.png"))} style={{ position: "absolute", width: "100%", opacity: interpolate(frame, [progSwapRel - 6, progSwapRel + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
  </>;
};
