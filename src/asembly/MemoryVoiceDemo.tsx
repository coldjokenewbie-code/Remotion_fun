import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { EndCard, FONT, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, Subtitle, TitleCard } from "./shared";

// ═══ 記憶中的聲音示範 v2（0B-3 職工的回憶）──時間軸與文案由 props 控制（Studio 右欄可調）═══
// 場景：PO 提供 OB-3 三連（scene1 亮景→scene2 訪客舉手機→scene3 暗景聚光）
// 開場靜音；邀約旁白於「掃描結束」起播，前輩口述於「口述開始」起播，字幕連動
const 幀 = (預設: number, 說明: string) => z.number().int().min(0).max(3000).default(預設).describe(說明);

export const memoryVoiceSchema = z.object({
  時間軸: z.object({
    場景2切換: 幀(36, "訪客舉手機中景進入幀"),
    場景3切換: 幀(50, "暗景聚光近景進入幀"),
    手機進場: 幀(62, "拉出面板＋手機出現幀"),
    掃描結束: 幀(150, "掃描完成→記憶分頁；邀約旁白與字幕同時起播"),
    口述開始: 幀(410, "前輩口述音檔起播幀"),
    口述長度: 幀(156, "口述節錄播放長度（幀）"),
    進度條切換: 幀(470, "App 進度條 0:01→0:04 畫面切換幀"),
    淡出開始: 幀(574, "結尾黑幕淡出起點"),
    總長: 幀(600, "影片總長（幀，30fps）"),
  }),
  文案: z.object({
    標題: z.string().default("記憶中的聲音"),
    副標: z.string().default("掃描展板 QR，播放前輩口述與工作記憶"),
    掃描完成標語: z.string().default("✓ 已辨識・開啟記憶中的聲音"),
    邀約字幕: z.string().default("掃描展板，可聆聽前輩口述；從工作與生活片段，保存工場記憶。"),
    口述字幕: z.string().default("1938 年，由臺北鐵道工技手新鄉重夫，"),
    落款: z.string().default("掃描展板 QR，播放前輩口述記憶"),
  }),
});
export type MemoryVoiceProps = z.infer<typeof memoryVoiceSchema>;
export const memoryVoiceDefaultProps: MemoryVoiceProps = memoryVoiceSchema.parse({ 時間軸: {}, 文案: {} });

type Timing = { s2aStart: number; s2bStart: number; phoneIn: number; scanEnd: number; voMemory: number; memoryDuration: number; progSwap: number; fadeOut: number; total: number };
const toT = (t: MemoryVoiceProps["時間軸"]): Timing => ({
  s2aStart: t.場景2切換, s2bStart: t.場景3切換, phoneIn: t.手機進場, scanEnd: t.掃描結束,
  voMemory: t.口述開始, memoryDuration: t.口述長度, progSwap: t.進度條切換, fadeOut: t.淡出開始, total: t.總長,
});

const A = (p: string) => `asembly/memory/${p}`;
const SCENE_QR = { x: 118, y: 376, size: 26 };
const SCAN_QR = { x: 241, y: 500, size: 131 };
const SPOT3 = { x: "6.4%", y: "42.8%" };
const PHONE_ANCHOR = { x: 123, y: 462 };

const MemoryBackground: React.FC<{ T: Timing }> = ({ T }) => {
  const frame = useCurrentFrame();
  const s1Scale = interpolate(frame, [0, T.s2aStart + 8], [1.05, 1.12]);
  const in2 = interpolate(frame, [T.s2aStart, T.s2aStart + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s2Scale = interpolate(frame, [T.s2aStart, T.s2bStart + 8], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const in3 = interpolate(frame, [T.s2bStart, T.s2bStart + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push3 = interpolate(frame, [T.s2bStart, T.scanEnd + 20], [1.02, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bgDim = interpolate(frame, [T.scanEnd - 10, T.scanEnd + 20], [0, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <>
    {frame < T.s2aStart + 8 && <Img src={staticFile(A("scene1_0B3.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />}
    {frame >= T.s2aStart && frame < T.s2bStart + 8 && (
      <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${s2Scale})` }}>
        <Img src={staticFile(A("scene2_0B3.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    {frame >= T.s2bStart && (
      <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
        <Img src={staticFile(A("scene3_0B3_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    )}
    <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />
  </>;
};

export const MemoryVoiceDemo: React.FC<MemoryVoiceProps> = ({ 時間軸, 文案 }) => {
  const frame = useCurrentFrame();
  const T = toT(時間軸);
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <MemoryBackground T={T} />

      {/* 段1 覆蓋層 */}
      <Sequence from={0} durationInFrames={T.scanEnd}>
        <TitleCard index={3} title={文案.標題} subtitle={文案.副標} enterFrame={2} />
      </Sequence>
      <Sequence from={0} durationInFrames={T.s2aStart}>
        <SceneQrCallout src={A("qr_memory_0B3_labeled.png")} enterFrame={20} target={SCENE_QR}
          backgroundScale={interpolate(frame, [0, T.s2aStart + 18], [1.05, 1.12])}
          card={{ x: 200, y: 400, width: 320 }} />
      </Sequence>

      {/* 拉出面板：掃描→記憶分頁（真實進度條 0:01→0:04）；不能包 Sequence */}
      <PhoneBubble anchor={PHONE_ANCHOR} visibleFrom={T.phoneIn} visibleTo={T.fadeOut}>
        {frame >= T.phoneIn - 5 && (
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={T.phoneIn} left={-76} top={10}>
            {frame < T.scanEnd && <ScanView bg={A("scan_panel.png")} from={T.phoneIn + 10} to={T.scanEnd} qr={SCAN_QR} doneLabel={文案.掃描完成標語} />}
            {frame >= T.scanEnd && (
              <>
                <Img src={staticFile(A("app_memory_play1.png"))} style={{ position: "absolute", width: "100%", opacity: frame >= T.progSwap ? 0 : 1 }} />
                <Img src={staticFile(A("app_memory_play2.png"))} style={{ position: "absolute", width: "100%", opacity: interpolate(frame, [T.progSwap - 6, T.progSwap + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
              </>
            )}
          </PhoneAssetFrame>
        )}
      </PhoneBubble>

      {/* 功能段聲音：展項介紹 → 人才培育原始音檔節錄（真素材）；起點隨時間軸連動 */}
      <Sequence from={T.scanEnd}><Audio src={staticFile(A("vo_memory_invite_tw.mp3"))} /></Sequence>
      <Sequence from={T.voMemory} durationInFrames={T.memoryDuration}><Audio src={staticFile(A("vo_s2_memory_excerpt.mp3"))} /></Sequence>

      {/* 字幕（時間隨時間軸連動，只需改文字） */}
      <Subtitle lines={[
        { text: 文案.邀約字幕, from: T.scanEnd, to: T.voMemory },
        { text: 文案.口述字幕, from: T.voMemory, to: T.voMemory + T.memoryDuration },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      <EndCard feature={文案.落款} index={3} fade={fade} />
    </AbsoluteFill>
  );
};
