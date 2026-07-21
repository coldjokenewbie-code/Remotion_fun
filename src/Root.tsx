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
        defaultProps={{"時間軸":{"標題段":{"開始":0,"結束":60},"掃展牌段":{"開始":60,"結束":120},"服務台段":{"開始":120,"結束":180},"情境手機":{"開始":180,"結束":240},"情境一找休息":{"開始":240,"結束":285},"情境二下一站":{"開始":290,"結束":330},"情境三展演提醒":{"開始":330,"結束":375},"情境四搜尋":{"開始":375,"結束":558},"黑幕淡出":{"開始":558,"結束":588}},"文案":{"館名":"國家鐵道博物館","主標":"組立工場\n行動導覽系統","服務定位":"服務定位：老職工帶路，重現組立工場記憶與痕跡","掃展牌卡":{"標題":"掃描展牌 QR code","副標":"直達展品功能頁"},"服務台卡":{"標題":"掃描服務台 QR code 或點選連結","副標":"進入首頁尋找服務"},"掃描完成標語":"✓ 已辨識・開啟展品功能頁","情境卡":[{"標題":"找休息與服務","副標":"地圖標示服務地點"},{"標題":"接下來看什麼","副標":"組立·下一站推薦"},{"標題":"展演即將開始","副標":"主動提醒"},{"標題":"尋找特定展項","副標":"輸入名稱 尋找想看的展品"}]}}}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.黑幕淡出.結束 })}
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
          時間軸: {
            亮景全景: { 開始: 0, 結束: 36 },
            暗景中景: { 開始: 36, 結束: 50 },
            近景正視: { 開始: 50, 結束: 876 },
            標題段: { 開始: 0, 結束: 160 },
            開場QR示意: { 開始: 0, 結束: 36 },
            手機面板: { 開始: 62, 結束: 850 },
            掃描畫面: { 開始: 72, 結束: 160 },
            中文旁白: { 開始: 160, 結束: 460 },
            日文段: { 開始: 460, 結束: 850 },
            黑幕淡出: { 開始: 850, 結束: 876 },
          },
          文案: {
            標題: "語音導覽",
            副標: "掃描展板 QR，開啟該展項語音解說",
            語音說明卡: "以語音介紹展示內容，參觀民眾可以邊聽邊操作望遠鏡，觀看空襲遺留的歷史痕跡。",
            多語卡標題: "多語服務",
            多語卡內容: "同一展項支援中・英・日語音與介面切換",
            落款: "語音導覽與中・英・日多語服務",
          },
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.黑幕淡出.結束 })}
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
          時間軸: {
            亮景全景: { 開始: 0, 結束: 30 },
            訪客中景: { 開始: 30, 結束: 44 },
            暗景聚光: { 開始: 44, 結束: 450 },
            標題段: { 開始: 0, 結束: 72 },
            開場QR示意: { 開始: 0, 結束: 30 },
            手機面板: { 開始: 58, 結束: 426 },
            掃描畫面: { 開始: 68, 結束: 120 },
            手指點按: { 開始: 230, 結束: 304 },
            黑幕淡出: { 開始: 426, 結束: 450 },
          },
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
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.黑幕淡出.結束 })}
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
          時間軸: {
            亮景全景: { 開始: 0, 結束: 36 },
            訪客中景: { 開始: 36, 結束: 50 },
            暗景聚光: { 開始: 50, 結束: 600 },
            標題段: { 開始: 0, 結束: 150 },
            開場QR示意: { 開始: 0, 結束: 36 },
            手機面板: { 開始: 62, 結束: 574 },
            掃描畫面: { 開始: 72, 結束: 150 },
            展示音檔: { 開始: 150, 結束: 574 },
            小標卡一: { 開始: 150, 結束: 410 },
            小標卡二: { 開始: 410, 結束: 574 },
            進度畫面: { 開始: 470, 結束: 574 },
            黑幕淡出: { 開始: 574, 結束: 600 },
          },
          文案: {
            標題: "記憶中的聲音",
            副標: "掃描展板 QR，播放前輩口述與工作記憶",
            掃描完成標語: "✓ 已辨識・開啟記憶中的聲音",
            小標卡一: "掃描展板，可聆聽前輩口述；從工作與生活片段，保存工場記憶。",
            小標卡二: "1938 年，由臺北鐵道工技手新鄉重夫，",
            螢幕說明文字: "1938年由臺北鐵道工技手新鄉重夫，倡議設立技工見習教習所（戰後改為技工養成所），教導練習生理解當效率為主的「作業流程」，搭配「師徒制」訓練，達到技術的精進，以及工場管理與修製效率之目的。",
            落款: "掃描展板 QR，播放前輩口述記憶",
          },
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.黑幕淡出.結束 })}
      />
      <Composition
        id="QuestDemo"
        component={QuestDemo}
        durationInFrames={690}
        fps={30}
        width={1920}
        height={1080}
        schema={questDemoSchema}
        defaultProps={{
          時間軸: {
            大廳場景: { 開始: 0, 結束: 60 },
            遊玩場景: { 開始: 60, 結束: 140 },
            鑽削機台: { 開始: 140, 結束: 420 },
            證書機台: { 開始: 420, 結束: 500 },
            補充場景: { 開始: 500, 結束: 560 },
            標題段: { 開始: 0, 結束: 60 },
            機台QR示意: { 開始: 220, 結束: 280 },
            手機面板: { 開始: 232, 結束: 560 },
            掃描畫面: { 開始: 240, 結束: 280 },
            任務說明頁: { 開始: 280, 結束: 370 },
            參加點按: { 開始: 330, 結束: 368 },
            進度頁: { 開始: 370, 結束: 420 },
            完成頁: { 開始: 420, 結束: 500 },
            清單頁: { 開始: 500, 結束: 560 },
            黑幕收尾: { 開始: 560, 結束: 690 },
            書擋標題: { 開始: 568, 結束: 640 },
            落款: { 開始: 640, 結束: 690 },
          },
          文案: {
            標題: "每日任務",
            副標: "現場遊玩或開啟 App 皆可參加",
            掃描中標語: "相機・對準機台 QR",
            掃描完成標語: "✓ 已辨識・顯示本日任務",
            參加按鈕: "參加任務・記錄進度",
            落款: "五項任務完成後產生結業證書",
            字幕: [
              { 文字: "組立工場練習所開放五座互動機具，可直接操作體驗。", 起: 60, 訖: 220 },
              { 文字: "完成操作後，機台提示掃描 QR code。", 起: 220, 訖: 300 },
              { 文字: "掃描後顯示本日任務與完成獎勵，可選擇參加並記錄進度。", 起: 300, 訖: 370 },
              { 文字: "完成各機台後進度自動更新，五項完成產生結業證書。", 起: 370, 訖: 500 },
              { 文字: "也可直接開啟 App 每日任務，接下本日任務。", 起: 500, 訖: 560 },
            ],
          },
        }}
        calculateMetadata={({ props }) => ({ durationInFrames: props.時間軸.落款.結束 })}
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
