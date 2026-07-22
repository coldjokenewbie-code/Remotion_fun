import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FingerTap, FONT, InfoCard, InfoCardRun, PhoneAssetFrame, PhoneBubble, ScanView, TitleCard } from "./shared";

// ═══ 掃展牌 QR，直達這件展品（PO 2026-07-21 腳本）──比照語音導覽/AR 軌道制 ═══
// 掃描段落取自語音導覽片 f81–422 的場景與手機面板；掃描後直開原型實頁 /exhibit/0B7（空襲），
// 頁面下捲至「推薦項目」，手指點按護廠行動 → push 進 /exhibit/0B9（護廠行動）實頁
const 軌 = (開始: number, 結束: number, 說明: string) =>
  z.object({
    開始: z.number().int().min(0).max(3000).describe(`${說明}——開始幀`),
    結束: z.number().int().min(0).max(3000).describe(`${說明}——結束幀`),
  }).default({ 開始, 結束 });

export const scanDirectSchema = z.object({
  時間軸: z.object({
    近景背景: 軌(0, 342, "背景：展台近景正視（全程）"),
    標題段: 軌(0, 160, "左上功能標示卡顯示窗"),
    手機面板: 軌(0, 330, "拉出面板＋手持手機在場窗"),
    掃描畫面: 軌(0, 80, "手機內相機掃描畫面（結束＝切展品頁）"),
    展品頁: 軌(80, 170, "空襲展品頁 0B7（結束＝切推薦展項頁）"),
    頁面捲動: 軌(112, 140, "展品頁下捲至推薦項目區"),
    手指點按: 軌(130, 185, "手指滑入點按推薦項目：護廠行動"),
    推薦展項頁: 軌(170, 318, "推薦展項頁 0B9：護廠行動"),
    說明卡一: 軌(90, 168, "左側說明卡：直達展品頁"),
    說明卡二: 軌(185, 318, "左側說明卡：推薦項目"),
    推薦標示: 軌(122, 220, "推薦項目字卡＋拉線（線至換頁即退場）"),
    黑幕淡出: 軌(318, 342, "結尾黑幕；結束幀＝影片總長"),
  }),
  文案: z.object({
    標題: z.string().default("掃描展牌 QR code"),
    副標: z.string().default("直達這件展品"),
    掃描完成標語: z.string().default("✓ 已辨識・開啟展品頁"),
    說明卡一: z.string().default("掃描展牌 QR code，直接開啟這件展品的功能頁。"),
    說明卡二: z.string().default("頁面提供「推薦項目」，點選直達相關展項。"),
    推薦說明卡: z.string().default("點選介紹頁面下方的推薦項目，進到遊客想看的展示項目，提供相關展項的更多資訊。"),
    推薦說明卡X: z.number().min(0).max(1920).default(620).describe("推薦字卡位置 X"),
    推薦說明卡Y: z.number().min(0).max(1080).default(700).describe("推薦字卡位置 Y"),
    推薦說明卡寬: z.number().default(520).describe("推薦字卡寬度"),
  }),
});
export type ScanDirectProps = z.infer<typeof scanDirectSchema>;

type Track = { 開始: number; 結束: number };
const dur = (t: Track) => t.結束 - t.開始;

const A = (p: string) => `asembly/airraid/${p}`; // 場景／手部／掃描畫面沿用語音導覽片素材
const D = (p: string) => `asembly/direct/${p}`;
const SPOT3 = { x: "12.5%", y: "56%" };
const SCAN_QR = { x: 123, y: 544, size: 133 };
const PHONE_ANCHOR = { x: 240, y: 605 };
// 原型實頁尺寸（1x：390 寬）：0B7 全頁高 990 → 捲動距離 990-844；推薦卡中心（頁座標 104, 865）
const PAGE_0B7_H = 990;
const SCROLL_DIST = PAGE_0B7_H - 844;
// 捲動後視圖內卡中心 (104, 865-146=719) → PhoneAssetFrame 1035 素材座標（k=0.869, origin 207,92.3）
const TAP_TARGET: [number, number] = [297, 737]; // 內容貼底對齊後 +20（shared PhoneAssetFrame 2026-07-22）
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const ScanDirectDemo: React.FC<ScanDirectProps> = ({ 時間軸: T, 文案 }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [T.黑幕淡出.開始, T.黑幕淡出.結束 - 6], [0, 1], clamp);
  const push = interpolate(frame, [T.近景背景.開始, T.掃描畫面.結束 + 20], [1.1, 1.32], clamp);
  // 掃描完成進展品頁：背景切明亮正視圖（PO 2026-07-22），後續頁面沿用；虛線拉線同時退場
  const brightIn = interpolate(frame, [T.掃描畫面.結束, T.掃描畫面.結束 + 12], [0, 1], clamp);
  const brightZoom = interpolate(frame, [T.掃描畫面.結束, T.近景背景.結束], [1.02, 1.1], clamp);
  const tapStartRel = T.手指點按.開始 - T.手機面板.開始;
  const tapEndRel = T.手指點按.結束 - T.手機面板.開始;
  const tapAtRel = T.展品頁.結束 - T.手機面板.開始 - 10; // 換頁前 10 幀按下
  const scrollRel = { from: T.頁面捲動.開始 - T.展品頁.開始, to: T.頁面捲動.結束 - T.展品頁.開始 };

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <Sequence name="近景背景" from={T.近景背景.開始} durationInFrames={dur(T.近景背景)}>
        {brightIn < 1 && <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: `${SPOT3.x} ${SPOT3.y}` }}>
          <Img src={staticFile(A("scene3_0B7_close.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>}
        {brightIn > 0 && <div style={{ position: "absolute", inset: 0, opacity: brightIn, transform: `scale(${brightZoom})`, transformOrigin: "50% 50%" }}>
          <Img src={staticFile(D("scene_0B7_bright.png"))} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        </div>}
      </Sequence>

      <Sequence name="標題段" from={T.標題段.開始} durationInFrames={dur(T.標題段)}>
        <TitleCard index={2} title={文案.標題} subtitle={文案.副標} enterFrame={0} />
      </Sequence>

      <Sequence name="手機面板" from={T.手機面板.開始} durationInFrames={dur(T.手機面板)}>
        <PhoneBubble anchor={PHONE_ANCHOR} visibleFrom={0} visibleTo={dur(T.手機面板)}
          leaderWindow={{ from: 0, to: T.掃描畫面.結束 - T.手機面板.開始 }}>
          <PhoneAssetFrame src={A("hand_po.png")} enterFrame={0} left={-76} top={10}
            overlay={<FingerTap src={A("finger_tap_po.png")} tip={[881, 161]} imgSize={1024} scale={0.87}
              target={TAP_TARGET} start={tapStartRel} tapAt={tapAtRel} end={tapEndRel} from={[-560, 500]} />}>
            <Sequence name="掃描畫面" from={T.掃描畫面.開始 - T.手機面板.開始} durationInFrames={dur(T.掃描畫面)}>
              <ScanView bg={A("scan_screen_po.png")} from={10} to={dur(T.掃描畫面)} qr={SCAN_QR} chrome={false} doneLabel={文案.掃描完成標語} />
            </Sequence>
            <Sequence name="展品頁" from={T.展品頁.開始 - T.手機面板.開始} durationInFrames={dur(T.展品頁)}>
              <ExhibitPage scrollFrom={scrollRel.from} scrollTo={scrollRel.to} />
            </Sequence>
            <Sequence name="推薦展項頁" from={T.推薦展項頁.開始 - T.手機面板.開始} durationInFrames={dur(T.手機面板) - (T.推薦展項頁.開始 - T.手機面板.開始)}>
              <RecoPage />
            </Sequence>
          </PhoneAssetFrame>
        </PhoneBubble>
      </Sequence>

      <Sequence name="推薦標示" from={T.推薦標示.開始} durationInFrames={dur(T.推薦標示)}>
        <RecoCallout text={文案.推薦說明卡} x={文案.推薦說明卡X} y={文案.推薦說明卡Y} w={文案.推薦說明卡寬}
          lineOff={T.推薦展項頁.開始 - T.推薦標示.開始} len={dur(T.推薦標示)} />
      </Sequence>

      <Sequence name="說明卡一" from={T.說明卡一.開始} durationInFrames={dur(T.說明卡一)}>
        <InfoCard at={8} body={文案.說明卡一} />
      </Sequence>
      <Sequence name="說明卡二" from={T.說明卡二.開始} durationInFrames={dur(T.說明卡二)}>
        <InfoCard at={8} body={文案.說明卡二} />
      </Sequence>

      <Sequence name="黑幕淡出" from={T.黑幕淡出.開始} durationInFrames={dur(T.黑幕淡出)}>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      </Sequence>
    </AbsoluteFill>
  );
};

// 推薦項目字卡＋拉線（PO 2026-07-22）：卡指向手機畫面下方推薦縮圖（縮圖全域約 1330,818）；
// 換頁（推薦展項頁開始）後縮圖消失，拉線先退場、卡片續留
const RecoCallout: React.FC<{ text: string; x: number; y: number; w: number; lineOff: number; len: number }> = ({ text, x, y, w, lineOff, len }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [4, 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const lineFade = Math.min(t, interpolate(frame, [lineOff - 8, lineOff], [1, 0], clamp));
  const from: [number, number] = [x + w, y + 60];
  const to: [number, number] = [1330, 818];
  return <>
    <InfoCardRun lines={[{ text, from: 0, to: len, x, y, width: w }]} />
    {lineFade > 0.001 && <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: lineFade, pointerEvents: "none" }}>
      <line x1={from[0]} y1={from[1]} x2={from[0] + (to[0] - from[0]) * t} y2={from[1] + (to[1] - from[1]) * t} stroke="#fff" strokeWidth={3.5} strokeDasharray="10 7" />
      {t >= 1 && <circle cx={to[0]} cy={to[1]} r={8} fill="none" stroke="#fff" strokeWidth={3} />}
    </svg>}
  </>;
};

// 空襲展品頁 0B7（原型全頁截圖）：定住頂部 → 下捲至推薦項目區；底部疊乾淨導覽列
const ExhibitPage: React.FC<{ scrollFrom: number; scrollTo: number }> = ({ scrollFrom, scrollTo }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [scrollFrom, scrollTo], [0, -SCROLL_DIST], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#f6f5f3", overflow: "hidden" }}>
      <Img src={staticFile(D("exhibit_0B7_full.png"))} style={{ position: "absolute", left: 0, top: y, width: 390, height: PAGE_0B7_H }} />
      <Img src={staticFile(D("navbar_app.png"))} style={{ position: "absolute", left: 0, bottom: 0, width: 390 }} />
    </div>
  );
};

// 推薦展項頁 0B9：護廠行動（原型截圖）
// 換頁動態照原型 index.css page-enter：整頁重掛載，opacity 0→1＋translateY 14px→0，0.35s（≈11 幀）ease-out，回頁頂
const RecoPage: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 11], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#f6f5f3", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: t, transform: `translateY(${14 * (1 - t)}px)` }}>
        <Img src={staticFile(D("exhibit_0B9.png"))} style={{ position: "absolute", left: 0, top: 0, width: 390, height: 902 }} />
      </div>
      <Img src={staticFile(D("navbar_app.png"))} style={{ position: "absolute", left: 0, bottom: 0, width: 390 }} />
    </div>
  );
};
