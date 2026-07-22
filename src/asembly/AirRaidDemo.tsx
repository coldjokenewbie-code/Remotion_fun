import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FingerTap, FONT, InfoCard, PhoneAssetFrame, PhoneBubble, ScanView, SceneQrCallout, TitleCard } from "./shared";

// ═══ CDIC_O4 式軌道制：每軌 {開始,結束}，Sequence 名＝props 欄名（時間軸面板左右對應）═══
// 空間圖 v3（PO 提供 0B-7 展台渲染三連）；開場靜音，旁白自「中文旁白」軌起
const 軌 = (開始: number, 結束: number, 說明: string) =>
  z.object({
    開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
    結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
  }).default({ 開始, 結束 });

export const airRaidSchema = z.object({
  時間軸: z.object({
    亮景全景: 軌(0, 36, "背景：展台亮景全景"),
    暗景中景: 軌(36, 50, "背景：暗景中景（QR 聚光）"),
    近景正視: 軌(50, 876, "背景：近景正視（其後持續）"),
    標題段: 軌(0, 160, "左上功能標示卡顯示窗"),
    開場QR示意: 軌(0, 36, "左側 QR 放大示意卡"),
    手機面板: 軌(62, 850, "拉出面板＋手持手機在場窗"),
    掃描畫面: 軌(72, 160, "手機內相機掃描畫面（結束＝切 App 分頁待播態）"),
    中文旁白: 軌(190, 490, "中文旁白播放窗（開始＝點 Play；前段為待播畫面）"),
    日文段: 軌(490, 905, "點 JP→日文待播介面＋多語卡"),
    日文旁白: 軌(518, 905, "日文旁白播放窗（開始＝第二次點 Play）"),
    黑幕淡出: 軌(850, 876, "結尾黑幕；結束幀＝影片總長"),
  }),
  文案: z.object({
    標題: z.string().default("語音導覽"),
    副標: z.string().default("掃描展板 QR，開啟該展項語音解說"),
    語音說明卡: z.string().default("以語音介紹展示內容，參觀民眾可以邊聽邊操作望遠鏡，觀看空襲遺留的歷史痕跡。"),
    多語卡標題: z.string().default("多語服務"),
    多語卡內容: z.string().default("同一展項支援中・英・日語音與介面切換"),
  }),
});
export type AirRaidProps = z.infer<typeof airRaidSchema>;
export const airRaidDefaultProps: AirRaidProps = airRaidSchema.parse({ 時間軸: {}, 文案: {} });

type Track = { 開始: number; 結束: number };
const dur = (t: Track) => t.結束 - t.開始;

const A = (p: string) => `asembly/airraid/${p}`;
const SPOT2 = { x: "19.7%", y: "69.5%" };
const SPOT3 = { x: "12.5%", y: "56%" };
const SCENE_QR = { x: 653, y: 810, size: 16 };
// PO 設計稿 scan_screen_po.png（真 QR 合成 decode=0B-7?f=audio）
const SCAN_QR = { x: 123, y: 544, size: 133 };
const PHONE_ANCHOR = { x: 240, y: 605 };
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const AirRaidDemo: React.FC<AirRaidProps> = ({ 時間軸: T, 文案 }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [T.黑幕淡出.開始, T.黑幕淡出.結束 - 6], [0, 1], clamp);
  const s1Scale = interpolate(frame, [T.亮景全景.開始, T.亮景全景.結束 + 8], [1.05, 1.12]);
  const push2 = interpolate(frame, [T.暗景中景.開始, T.暗景中景.結束 + 8], [1, 1.18], clamp);
  const in2 = interpolate(frame, [T.暗景中景.開始, T.暗景中景.開始 + 8], [0, 1], clamp);
  const push3 = interpolate(frame, [T.近景正視.開始, T.掃描畫面.結束 + 20], [1.05, 1.32], clamp);
  const in3 = interpolate(frame, [T.近景正視.開始, T.近景正視.開始 + 8], [0, 1], clamp);
  // 掃描完成切 App 分頁：背景換明亮正視圖（與掃展牌直達片共用素材），拉線同步退場（PO 2026-07-22）
  const brightIn = interpolate(frame, [T.掃描畫面.結束, T.掃描畫面.結束 + 12], [0, 1], clamp);
  const brightZoom = interpolate(frame, [T.掃描畫面.結束, T.近景正視.結束], [1.02, 1.1], clamp);
  // 手機面板軌內的相對切換點（PO 2026-07-22：播放前須明確點 Play——中/日各一次）
  const scanRel = { from: T.掃描畫面.開始 - T.手機面板.開始 + 10, to: T.掃描畫面.結束 - T.手機面板.開始 };
  const jpRel = T.日文段.開始 - T.手機面板.開始;
  const twPlayRel = T.中文旁白.開始 - T.手機面板.開始;
  const jpPlayRel = T.日文旁白.開始 - T.手機面板.開始;
  const PLAY_BTN: [number, number] = [261, 471]; // app 分頁 Play 鍵（素材座標；螢幕 62,413 換算）

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* 背景三軌（推鏡/淡變參數由絕對幀計算後帶入） */}
      <Sequence name="亮景全景" from={T.亮景全景.開始} durationInFrames={dur(T.亮景全景) + 8}>
        <Img src={staticFile(A("scene1_0B7.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s1Scale})` }} />
      </Sequence>
      <Sequence name="暗景中景" from={T.暗景中景.開始} durationInFrames={dur(T.暗景中景) + 8}>
        <div style={{ position: "absolute", inset: 0, opacity: in2, transform: `scale(${push2})`, transformOrigin: `${SPOT2.x} ${SPOT2.y}` }}>
          <Img src={staticFile(A("scene2_0B7_dim.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </Sequence>
      <Sequence name="近景正視" from={T.近景正視.開始} durationInFrames={T.近景正視.結束 - T.近景正視.開始}>
        {brightIn < 1 && <div style={{ position: "absolute", inset: 0, opacity: in3, transform: `scale(${push3})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
          <Img src={staticFile(A("scene3_0B7_close.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>}
        {brightIn > 0 && <div style={{ position: "absolute", inset: 0, opacity: brightIn, transform: `scale(${brightZoom})`, transformOrigin: "50% 50%" }}>
          <Img src={staticFile("asembly/direct/scene_0B7_bright.png")} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>}
      </Sequence>

      <Sequence name="標題段" from={T.標題段.開始} durationInFrames={dur(T.標題段)}>
        <TitleCard index={1} title={文案.標題} subtitle={文案.副標} enterFrame={0} />
      </Sequence>
      <Sequence name="開場QR示意" from={T.開場QR示意.開始} durationInFrames={dur(T.開場QR示意)}>
        <SceneQrCallout src={A("qr_audio_0B7_labeled.png")} enterFrame={20} target={SCENE_QR} backgroundScale={s1Scale} />
      </Sequence>

      {/* 手機面板（螢幕內容依掃描/日文軌切換；點按手指於日文段開始前滑入） */}
      <Sequence name="手機面板" from={T.手機面板.開始} durationInFrames={dur(T.手機面板)}>
        <PhoneBubble anchor={PHONE_ANCHOR} visibleFrom={0} visibleTo={dur(T.手機面板)}
          leaderWindow={{ from: 0, to: T.掃描畫面.結束 - T.手機面板.開始 }}>
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={0} left={-76} top={10}
            overlay={<>
              <FingerTap src={A("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={0.87}
                target={PLAY_BTN} start={twPlayRel - 32} tapAt={twPlayRel - 6} end={twPlayRel + 40} from={[-560, 500]} />
              <FingerTap src={A("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={0.87}
                target={[476, 139]} start={jpRel - 36} tapAt={jpRel - 6} end={jpRel + 38} from={[-560, 500]} />
              <FingerTap src={A("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={0.87}
                target={PLAY_BTN} start={jpPlayRel - 32} tapAt={jpPlayRel - 6} end={jpPlayRel + 40} from={[-560, 500]} />
            </>}>
            <Sequence name="掃描畫面" from={T.掃描畫面.開始 - T.手機面板.開始} durationInFrames={dur(T.掃描畫面)}>
              <ScanView bg={A("scan_screen_po.png")} from={10} to={dur(T.掃描畫面)} qr={SCAN_QR} chrome={false} />
            </Sequence>
            <Sequence name="App語音分頁" from={T.掃描畫面.結束 - T.手機面板.開始} durationInFrames={dur(T.手機面板) - (T.掃描畫面.結束 - T.手機面板.開始)}>
              <AppScreenSwap twPlayAtRel={twPlayRel - (T.掃描畫面.結束 - T.手機面板.開始)} jpAtRel={jpRel - (T.掃描畫面.結束 - T.手機面板.開始)} jpPlayAtRel={jpPlayRel - (T.掃描畫面.結束 - T.手機面板.開始)} />
            </Sequence>
          </PhoneAssetFrame>
        </PhoneBubble>
      </Sequence>

      <Sequence name="中文旁白" from={T.中文旁白.開始} durationInFrames={dur(T.中文旁白)}>
        <Audio src={staticFile(A("vo_airraid_guide_tw_v3.mp3"))} />
        <InfoCard at={4} body={文案.語音說明卡} />
      </Sequence>
      <Sequence name="日文段" from={T.日文段.開始} durationInFrames={dur(T.日文段)}>
        <InfoCard at={8} title={文案.多語卡標題} body={文案.多語卡內容} />
      </Sequence>
      <Sequence name="日文旁白" from={T.日文旁白.開始} durationInFrames={dur(T.日文旁白)}>
        <Audio src={staticFile(A("vo_s3_ja_v3.mp3"))} />
      </Sequence>

      <Sequence name="黑幕淡出" from={T.黑幕淡出.開始} durationInFrames={dur(T.黑幕淡出)}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      </Sequence>
    </AbsoluteFill>
  );
};

// 掃描結束後的 App 分頁四態：中文待播→點 Play 播放→切日文待播→點 Play 播放（rel＝本 Sequence 內相對幀）
const AppScreenSwap: React.FC<{ twPlayAtRel: number; jpAtRel: number; jpPlayAtRel: number }> = ({ twPlayAtRel, jpAtRel, jpPlayAtRel }) => {
  const frame = useCurrentFrame();
  const src = frame < twPlayAtRel ? "app_tw_idle.png" : frame < jpAtRel ? "app_tw_play.png" : frame < jpPlayAtRel ? "app_jp_idle.png" : "app_jp_play.png";
  return <Img src={staticFile(A(src))} style={{ position: "absolute", width: "100%" }} />;
};
