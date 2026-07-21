# AGENT_SPEC — OverviewIntro v2（PO 2026-07-21 退修六點；codex 執行）

> Tech Lead：Claude@Mac｜契約 asembly-overview-intro-20260721｜v1 已完成基礎，本輪為改版
> 工作目錄＝本 worktree。**只改** `src/asembly/OverviewIntro.tsx` 與 `src/index.tsx`（duration 變更）。不動其他檔。

## PO 退修要點（全部落實）
1. 每個情境背景換成對應功能的空間渲染/照片，不再全片用 OB-3 場景。
2. 服務句改「小標字卡」（左上深底橘邊卡，比照 TitleCard 視覺、無「導覽功能 0X/04」小標列），**不用底部字幕 Subtitle**。
3. 段2a 掃展牌＝重現 AirRaidDemo 第 4 秒畫面組成，換小標字卡。
4. 段3 ②③右側滑入推薦示意卡、手機同時左移。
5. 段4 四色 QR 段整段刪除，段3 結束直接淡出轉場（接後面功能片）。
6. 總長改 **480f**（16s），index.tsx 的 durationInFrames 同步改 480。無音軌不變。

## 時間軸 v2（480f@30fps）
| 段 | 幀 | 背景（staticFile） | 前景 | 小標字卡（title／subtitle，逐字） |
|---|---|---|---|---|
| 1 標題 | 0–120 | `asembly/overview/p2_scene.png`（cover＋Ken Burns 緩推 1.04→1.10） | f10–70 中央標題（沿用 v1：橘小標「國家鐵道博物館」＋主標「組立工場\n行動導覽系統」）；f60–120 定位卡「服務定位：老職工帶路，重現組立工場記憶與痕跡」（沿用 v1 樣式） | （本段沿用 v1 卡，無小標卡） |
| 2a 掃展牌 | 120–200 | `asembly/airraid/scene3_0B7_close.png`，`transform: scale(1.19)`、`transformOrigin: "12.5% 56%"`、疊 rgba(0,0,0,0.3)（重現 01 片 f120 視覺） | PhoneFrame enterFrame=128、x=380、hand=`asembly/airraid/hand_hold.png`；ScanView bg=`asembly/airraid/scan_panel.png`、from=138、to=196、qr={x:197,y:560,size:115} | 「掃描展牌 QR code」／「直達展品功能頁」（f126 進場） |
| 2b 服務台 | 200–270 | `asembly/overview/counter_scan.png`（cover＋緩推；PO 指定 服務台掃碼1） | PhoneFrame enterFrame=204、x=380：`asembly/overview/home.png` | 「掃描服務台 QR code 或點選連結」／「進入首頁尋找服務」 |
| 3① 休息 | 270–315 | `asembly/overview/hall_rest.jpg`（PO 指定 LINE_ALBUM_10） | PhoneFrame enterFrame=272、x=-340：map.png；f282 起右側滑入示意卡 `asembly/overview/rest_area.png`（與②③同樣式） | 「找休息與服務」／「地圖標示服務地點」 |
| 3② 下一站 | 315–360 | `asembly/overview/hall_next.jpg` | PhoneFrame enterFrame=317、x=-340：audience.png；f327 起右側滑入示意卡 `asembly/overview/rec_repair.jpg`（寬 ~760px、白框卡樣式、自畫面右緣滑至 x≈1090） | 「不知道接下來看什麼」／「組立·下一站推薦」 |
| 3③ 提醒 | 360–405 | `asembly/overview/hall_next.jpg`（沿用） | PhoneFrame enterFrame=362、x=-340：schedule.png；f372 右側滑入 `asembly/overview/rec_dt668.png`（同樣式） | 「重要展演即將開始」／「主動提醒」 |
| 3④ 搜尋 | 405–450 | `asembly/overview/hall_next.jpg`（沿用，無滑入卡） | PhoneFrame enterFrame=407、x=0：search_typing.png | 「尋找特定展項」／「輸入名稱直達展品頁」 |
| 轉場 | 450–480 | 全畫面淡至黑（450–474），直接接後面功能片，**無收束字卡、無 QR 段** | — | — |

## 小標字卡元件規格
左上 (64,56)，深底 rgba(15,18,25,0.78)＋`borderLeft: 6px solid #ff8a3d`＋圓角 10；title 36px/700、subtitle 22px `#d8dde6`；spring 左滑進場（比照 shared TitleCard，但**不要**「導覽功能 0X/04」行）。段切換時舊卡隨段落結束消失、新卡進場。

## 其他
- 手機左移（②③）：PhoneFrame 直接給 x=-340 定位即可（進場動畫自帶）；滑入卡進場用水平位移**但必須在最外層（無祖先 transform）**，避免 Chromium 巢狀 transform 不裁切問題；或改自右緣淡入＋輕微位移。
- KEYFRAMES 常數改為 `[60, 100, 160, 235, 292, 337, 382, 427, 465]`。
- 空間單元資訊如需查證，參考 Drive `information/R02_展示架構暨空間單元配置.pptx`（不需改文案，僅背景理解）。

## 驗收（executor 自檢後回報）
1. `npx tsc --noEmit` 通過。
2. 字卡文案與上表逐字一致；全檔無 Subtitle 底部字幕、無四色 QR 段、無「以下逐一示範」字卡。
3. 總長 480f（index.tsx 同步）、無 Audio。
4. 只 diff OverviewIntro.tsx＋index.tsx。
完成後覆寫 `AGENT_SIGNAL.log`：`DONE|codex|OverviewIntro-v2|<timestamp>`。
