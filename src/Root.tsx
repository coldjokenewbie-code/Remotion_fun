import React from "react";
import { Composition } from "remotion";
import { WorldTripMap } from "./WorldTripMap";
import { AirRaidDemo, airRaidSchema } from "./asembly/AirRaidDemo";
import { ARDemo, arDemoSchema } from "./asembly/ARDemo";
import { MemoryVoiceDemo, memoryVoiceSchema } from "./asembly/MemoryVoiceDemo";
import { QuestDemo, questDemoSchema } from "./asembly/QuestDemo";
import { OverviewIntro, overviewIntroSchema } from "./asembly/OverviewIntro";

// 五支示範片：時間軸/文案由 props 控制（Studio 右欄可調，Save 直接寫回本檔 defaultProps），
// 總長隨「總長」欄位連動。defaultProps 必須維持行內字面值（Studio 存檔碼改寫僅支援 literal）。
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="OverviewIntro"
        component={OverviewIntro}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
        schema={overviewIntroSchema}
        defaultProps={{
          時間軸: { 段2a掃展牌: 120, 段2b服務台: 200, 段3休息: 270, 段3下一站: 315, 段3提醒: 360, 段3搜尋: 405, 淡出開始: 450, 總長: 480 },
          文案: {
            館名: "國家鐵道博物館",
            主標: "組立工場\n行動導覽系統",
            服務定位: "服務定位：老職工帶路，重現組立工場記憶與痕跡",
            掃展牌卡: { 標題: "掃描展牌 QR code", 副標: "直達展品功能頁" },
            服務台卡: { 標題: "掃描服務台 QR code 或點選連結", 副標: "進入首頁尋找服務" },
            掃描完成標語: "✓ 已辨識・開啟展品功能頁",
            情境卡: [
              { 標題: "找休息與服務", 副標: "地圖標示服務地點" },
              { 標題: "不知道接下來看什麼", 副標: "組立·下一站推薦" },
              { 標題: "重要展演即將開始", 副標: "主動提醒" },
              { 標題: "尋找特定展項", 副標: "輸入名稱直達展品頁" },
            ],
          },
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
      />
      <Composition
        id="AirRaidDemo"
        component={AirRaidDemo}
        durationInFrames={876}
        fps={30}
        width={1920}
        height={1080}
        schema={airRaidSchema}
        defaultProps={{
          時間軸: { 場景2切換: 36, 場景3切換: 50, 手機進場: 62, 掃描結束: 160, 日文段開始: 460, 淡出開始: 850, 總長: 876 },
          文案: {
            標題: "語音導覽",
            副標: "掃描展板 QR，開啟該展項語音解說",
            語音說明卡: "以語音介紹展示內容，參觀民眾可以邊聽邊操作望遠鏡，觀看空襲遺留的歷史痕跡。",
            多語卡標題: "多語服務",
            多語卡內容: "同一展項支援中・英・日語音與介面切換",
            落款: "語音導覽與中・英・日多語服務",
          },
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
      />
      <Composition
        id="ARDemo"
        component={ARDemo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        schema={arDemoSchema}
        defaultProps={{
          時間軸: { 場景2切換: 30, 場景3切換: 44, 手機進場: 58, 標示卡結束: 72, 掃描結束: 120, 點按AR: 260, 淡出開始: 426, 總長: 450 },
          文案: {
            標題: "AR 探索",
            副標: "掃描展板 QR，在原址疊合機具歷史影像",
            掃描完成標語: "✓ 已辨識・開啟 AR 探索",
            落款: "AR 於展項原址呈現機具影像",
            字幕: [
              { 文字: "掃描展板 QR，開啟 AR 模式。", 起: 80, 訖: 150 },
              { 文字: "系統辨識展項位置與台工 1677 機具資料。", 起: 150, 訖: 230 },
              { 文字: "點選畫面按鈕，在機坑原址疊合機具影像。", 起: 230, 訖: 330 },
              { 文字: "畫面可對照機坑現況與機具原貌。", 起: 330, 訖: 420 },
            ],
          },
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
      />
      <Composition
        id="MemoryVoiceDemo"
        component={MemoryVoiceDemo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
        schema={memoryVoiceSchema}
        defaultProps={{
          時間軸: { 場景2切換: 36, 場景3切換: 50, 手機進場: 62, 掃描結束: 150, 字卡切換: 410, 進度條切換: 470, 淡出開始: 574, 總長: 600 },
          文案: {
            標題: "記憶中的聲音",
            副標: "掃描展板 QR，播放前輩口述與工作記憶",
            掃描完成標語: "✓ 已辨識・開啟記憶中的聲音",
            小標卡一: "掃描展板，可聆聽前輩口述；從工作與生活片段，保存工場記憶。",
            小標卡二: "1938 年，由臺北鐵道工技手新鄉重夫，",
            落款: "掃描展板 QR，播放前輩口述記憶",
          },
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
      />
      <Composition
        id="QuestDemo"
        component={QuestDemo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
        schema={questDemoSchema}
        defaultProps={{
          時間軸: { 手機進場: 20, 任務清單開始: 60, 地圖開始: 150, 遊玩場景: 180, 機台掃描開始: 230, 進度更新: 285, 證書場景: 350, 完成頁: 360, 淡出開始: 456, 書擋開始: 464, 落款開始: 546, 總長: 600 },
          文案: {
            標題: "每日任務",
            副標: "依地圖完成五項機具任務，掃描機台 QR 記錄進度",
            掃描中標語: "相機・對準機台 QR",
            掃描完成標語: "✓ 已辨識・任務進度已記錄",
            落款: "五項任務完成後產生結業證書",
            字幕: [
              { 文字: "系統以地圖列出五項機具任務與所在位置。", 起: 60, 訖: 210 },
              { 文字: "完成操作後掃描機台 QR，系統自動更新任務進度。", 起: 210, 訖: 350 },
              { 文字: "五項任務完成後，系統產生可下載的結業證書。", 起: 350, 訖: 450 },
            ],
          },
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.總長 })}
      />
      <Composition
        id="WorldTripMap"
        component={WorldTripMap}
        durationInFrames={600}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
