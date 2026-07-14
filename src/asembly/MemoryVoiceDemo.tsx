import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, PhoneFrame, QrCard, ScanView, Subtitle, TitleCard } from "./shared";

// ═══ 時間軸常數（30fps，總長 19.5s＝585f）════════════════════════
const T = {
  s2Start: 165,      // 段2 開始（5.5s）
  scanEnd: 213,      // 掃描完成→跳轉 App（7.1s）
  progSwap: 330,     // 播放進度截圖切換（11s）
  fadeOut: 552,      // 結尾淡出（18.4s）
  total: 585,
};
const VO = { s1: 9, s2: 195 }; // 邀請旁白、人才培育音檔節錄（9.5s 含尾端 fade）

const A = (p: string) => `asembly/memory/${p}`;

export const MemoryVoiceDemo: React.FC = () => {
  const frame = useCurrentFrame();
  // 背景：職工生活展演區場景渲染圖緩慢平移、段2 調暗（歷史內容畫面只出現在手機內）
  const bgShift = interpolate(frame, [0, T.total], [0, -60]);
  const bgDim = interpolate(frame, [T.s2Start - 15, T.s2Start + 15], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [T.fadeOut, T.total - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {/* 背景：p151 錦旗牆及職工生活展演區 渲染圖（展項位置場景，全程） */}
      <Img src={staticFile(A("bg_scene_p151.png"))} style={{ position: "absolute", width: "104%", height: "104%", objectFit: "cover", transform: `translateX(${bgShift}px)` }} />
      <div style={{ position: "absolute", inset: 0, background: `rgba(5,8,14,${bgDim})` }} />

      {/* 段1：標示卡＋QR 立牌 */}
      <Sequence from={0} durationInFrames={T.s2Start}>
        <TitleCard title="記憶中的聲音——技工養成所的回憶" subtitle="聽資深職工說當年的故事" enterFrame={10} />
        <QrCard src={A("qr.png")} label="掃描 QR code・記憶中的聲音" enterFrame={26} />
      </Sequence>

      {/* 段2：手機掃碼→記憶中的聲音分頁（原型實截，真實進度條 0:01→0:04） */}
      {frame >= T.s2Start - 5 && (
        <PhoneFrame enterFrame={T.s2Start}>
          {frame < T.scanEnd && <ScanView bg={A("bg_scene_p151.png")} qr={A("qr.png")} from={T.s2Start + 8} to={T.scanEnd} />}
          {frame >= T.scanEnd && (
            <>
              <Img src={staticFile(A("app_memory_play1.png"))} style={{ position: "absolute", width: "100%", opacity: frame >= T.progSwap ? 0 : 1 }} />
              <Img src={staticFile(A("app_memory_play2.png"))} style={{ position: "absolute", width: "100%", opacity: interpolate(frame, [T.progSwap - 6, T.progSwap + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
            </>
          )}
        </PhoneFrame>
      )}

      {/* 聲音：邀請旁白（TTS）→ 人才培育原始音檔節錄（真素材） */}
      <Sequence from={VO.s1}><Audio src={staticFile(A("vo_s1_invite.mp3"))} /></Sequence>
      <Sequence from={VO.s2}><Audio src={staticFile(A("vo_s2_memory_excerpt.mp3"))} /></Sequence>

      {/* 字幕（節錄段依 21.5s 全文語速估算，微調可改 from/to） */}
      <Subtitle lines={[
        { text: "這裡留著前輩們的聲音記憶。掃一下 QR code，聽聽當年的故事。", from: VO.s1, to: 168 },
        { text: "1938 年，由臺北鐵道工技手新鄉重夫，", from: VO.s2, to: 330 },
        { text: "倡議設立技工見習教習所（戰後改為技工養成所）。", from: 330, to: 480 },
      ]} />

      {/* 結尾淡出＋落款 */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fade, pointerEvents: "none" }} />
      {fade > 0.6 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: (fade - 0.6) / 0.4 }}>
          <div style={{ color: "#e8ecf2", fontSize: 34, letterSpacing: 6, fontWeight: 600 }}>組立工場行動導覽・記憶中的聲音</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
