import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FingerTap, FONT, InfoCardRun, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, TitleCard } from "./shared";

// ═══ 記憶中的聲音示範 v3（0B-3 職工的回憶）──CDIC_O4 式軌道制：Sequence 名＝props 欄名 ═══
// 掃描完成起播「人才培育.mp3」原始展示音檔（PO：音檔本身就是展示的一部分）
const 軌 = (開始: number, 結束: number, 說明: string) =>
  z.object({
    開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
    結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
  }).default({ 開始, 結束 });

export const memoryVoiceSchema = z.object({
  時間軸: z.object({
    亮景全景: 軌(0, 50, "背景：職工的回憶亮景"),
    暗景聚光: 軌(50, 450, "背景：暗景聚光（掃描完成後切亮景訪客中景照）"),
    標題段: 軌(0, 150, "左上功能標示卡顯示窗"),
    開場QR示意: 軌(0, 36, "左側 QR 放大示意卡"),
    手機面板: 軌(62, 426, "拉出面板＋手持手機在場窗"),
    掃描畫面: 軌(72, 150, "手機內相機掃描畫面（結束＝切記憶分頁待播態）"),
    展示音檔: 軌(190, 426, "人才培育.mp3 播放窗（開始＝點 Play；前段為待播畫面）"),
    黑幕淡出: 軌(426, 450, "結尾黑幕；結束幀＝影片總長"),
  }),
  文案: z.object({
    標題: z.string().default("記憶中的聲音"),
    副標: z.string().default("掃描展板 QR，播放前輩口述與工作記憶"),
    掃描完成標語: z.string().default("✓ 已辨識・開啟記憶中的聲音"),
    展品說明卡: z.string().default("點擊播放鍵後，可聆聽職工親口道出技工養成所的往事，增添場域的歷史氛圍。"),
    展品說明卡X: z.number().min(0).max(1920).default(72).describe("展品說明卡位置 X（卡片左上角）"),
    展品說明卡Y: z.number().min(0).max(1080).default(560).describe("展品說明卡位置 Y"),
    展品說明卡寬: z.number().default(640).describe("展品說明卡寬度"),
    螢幕說明文字: z.string().default("1938年由臺北鐵道工技手新鄉重夫，倡議設立技工見習教習所（戰後改為技工養成所），教導練習生理解當效率為主的「作業流程」，搭配「師徒制」訓練，達到技術的精進，以及工場管理與修製效率之目的。"),
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
  const in3 = interpolate(frame, [T.暗景聚光.開始, T.暗景聚光.開始 + 8], [0, 1], clamp);
  const push3 = interpolate(frame, [T.暗景聚光.開始, T.掃描畫面.結束 + 20], [1.02, 1.3], clamp);
  // 掃描完成切記憶分頁：背景換亮景訪客中景照並延續到片尾，拉線/暗景同步退場（PO 2026-07-22，比照 AR 片）
  const brightIn = interpolate(frame, [T.掃描畫面.結束, T.掃描畫面.結束 + 12], [0, 1], clamp);
  const brightZoom = interpolate(frame, [T.掃描畫面.結束, T.黑幕淡出.結束], [1.0, 1.08], clamp);
  const audioFadeRel = T.黑幕淡出.開始 - T.展示音檔.開始;

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <Sequence name="亮景全景" from={T.亮景全景.開始} durationInFrames={dur(T.亮景全景) + 8}>
        <Img src={staticFile(A("scene1_0B3.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />
      </Sequence>
      <Sequence name="暗景聚光" from={T.暗景聚光.開始} durationInFrames={dur(T.暗景聚光)}>
        {brightIn < 1 && <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
          <Img src={staticFile(A("scene3_0B3_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>}
        {brightIn > 0 && <div style={{ position: "absolute", inset: 0, opacity: brightIn, transform: `scale(${brightZoom})`, transformOrigin: "50% 50%" }}>
          <Img src={staticFile(A("scene2_0B3.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>}
      </Sequence>

      <Sequence name="標題段" from={T.標題段.開始} durationInFrames={dur(T.標題段)}>
        <TitleCard index={3} title={文案.標題} subtitle={文案.副標} enterFrame={0} />
      </Sequence>
      <Sequence name="開場QR示意" from={T.開場QR示意.開始} durationInFrames={dur(T.開場QR示意)}>
        <SceneQrCallout src={A("qr_memory_0B3_labeled.png")} enterFrame={20} target={SCENE_QR}
          backgroundScale={s1Scale} card={{ x: 200, y: 400, width: 320 }} />
      </Sequence>

      {/* 手機面板：掃描→記憶分頁待播→點 Play→播放（PO 2026-07-22：播放前須明確點 Play） */}
      <Sequence name="手機面板" from={T.手機面板.開始} durationInFrames={dur(T.手機面板)}>
        <PhoneBubble anchor={PHONE_ANCHOR} visibleFrom={0} visibleTo={dur(T.手機面板)}
          leaderWindow={{ from: 0, to: T.掃描畫面.結束 - T.手機面板.開始 }}>
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={0} left={-76} top={10}
            overlay={<FingerTap src="asembly/airraid/finger_tap_po.png" tip={[881, 161]} imgSize={1024} scale={0.87}
              target={[254, 746]} start={T.展示音檔.開始 - T.手機面板.開始 - 32} tapAt={T.展示音檔.開始 - T.手機面板.開始 - 6} end={T.展示音檔.開始 - T.手機面板.開始 + 40} from={[-560, 500]} />}>
            <Sequence name="掃描畫面" from={T.掃描畫面.開始 - T.手機面板.開始} durationInFrames={dur(T.掃描畫面)}>
              <ScanView bg={A("scan_panel.png")} from={10} to={dur(T.掃描畫面)} qr={SCAN_QR} doneLabel={文案.掃描完成標語} />
            </Sequence>
            <Sequence name="記憶分頁" from={T.掃描畫面.結束 - T.手機面板.開始} durationInFrames={dur(T.手機面板) - (T.掃描畫面.結束 - T.手機面板.開始)}>
              <MemoryScreen 說明文字={文案.螢幕說明文字} 播放起Rel={T.展示音檔.開始 - T.掃描畫面.結束} />
            </Sequence>
          </PhoneAssetFrame>
        </PhoneBubble>
      </Sequence>

      {/* 展品旁說明字卡（PO 2026-07-22 增設；點 Play 起顯示至黑幕） */}
      <Sequence name="展品說明卡" from={T.展示音檔.開始} durationInFrames={T.黑幕淡出.開始 - T.展示音檔.開始}>
        <InfoCardRun lines={[{ text: 文案.展品說明卡, from: 0, to: T.黑幕淡出.開始 - T.展示音檔.開始, x: 文案.展品說明卡X, y: 文案.展品說明卡Y, width: 文案.展品說明卡寬 }]} />
      </Sequence>

      {/* 展示音檔（人才培育原檔；隨黑幕淡出） */}
      <Sequence name="展示音檔" from={T.展示音檔.開始} durationInFrames={dur(T.展示音檔) + (T.黑幕淡出.結束 - T.黑幕淡出.開始)}>
        <Audio src={staticFile(A("vo_memory_full.mp3"))}
          volume={(f) => interpolate(f, [audioFadeRel - 6, audioFadeRel + 18], [1, 0], clamp)} />
      </Sequence>

      <Sequence name="黑幕淡出" from={T.黑幕淡出.開始} durationInFrames={dur(T.黑幕淡出)}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      </Sequence>
    </AbsoluteFill>
  );
};

const MemoryScreen: React.FC<{ 說明文字: string; 播放起Rel: number }> = ({ 說明文字, 播放起Rel }) => {
  const frame = useCurrentFrame();
  return <>
    <Img src={staticFile(A(frame < 播放起Rel ? "app_memory_idle.png" : "app_memory_play1.png"))} style={{ position: "absolute", width: "100%" }} />
    {/* 空白內容區補深度解說文字（PO 2026-07-21；來源 workingfiles/導覽裝置/線上解說/深度文字解說.txt） */}
    <div style={{ position: "absolute", left: 26, top: 342, width: 338, color: "#4a4a4a", fontSize: 15.5, lineHeight: 1.95, letterSpacing: 0.4, fontFamily: FONT, textAlign: "justify" }}>
      {說明文字}
    </div>
  </>;
};
