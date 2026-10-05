# TaskLog 2026-10-05 — 導覽示範片：ARDemo 新場景與 QuestDemo 遊玩場景 [Claude@comaMacBookAir]

> 工作線：組立工場行動導覽「導覽功能示範片」（src/asembly/，六支 composition）。交付物在 Drive `Asembly_PPT/outputs/demo動畫/`。
> 工作位置：本次在 `git_mirror/Remotion_fun` 啟動 Studio（Drive 端原無 src/asembly，結束時已白名單同步回 Drive）。

## 完成項目
- **ARDemo（02_AR探索）**
  - 立牌位置經 3 輪修正後，PO 改用新算繪 `AR2.jpg`：**只裁切不外擴**（x60–1036 全高 → 1920×1080；外擴會出錯）。
  - 新圖上板原無 QR：依上板四角 homography 貼 QR（板寬 13%）；場景二、三刪灰衣男子並合成掃碼訪客（Codex 第 4b 輪）。
  - 新增**場景 2.1**＝場景二去掉訪客，手機轉入 AR 分頁（第 139 格）即切換（沿用 12 格淡入）。
  - 手機截圖 `app_ar_before.png` 標籤「AR 系統準備中…」改「啟動 AR 系統」（App 原始碼不改，PO 裁定）。
  - `ARDemo.tsx`：SCENE_QR／SPOT3／PHONE_ANCHOR 對準 QR (435,412)；QR 示意卡 (760,180)。`Root.tsx` 說明卡 1 → (620,300)、3／4 → X700 寬 470。
  - 審閱頁：`workingfiles/ar_stand_fix_20261005/review.html`（各輪比對）。
- **QuestDemo（04_每日任務）**：`scene_play.png` 換成 W_04 p26 情境圖（實際遊戲畫面），並以原圖頭部像素補回左一小孩被螢幕蓋掉的頭。同步：W_04 簡報 image39 已 byte-swap、Interactive_machine 合成腳本加 `occluders()` 前景保留（記於該專案 TaskLog）。
- **交付**：`Asembly_PPT/outputs/demo動畫/render_2026-10-05/` 的 `02_AR探索_20261005.mp4`（15:02）、`04_每日任務_20261005.mp4`（PO 14:03 匯出）；被取代版在同層 `archive/`。
- **版控**：`bdedded`（AGENTS.md、忽略南科渲染複本）、`a898dae`（ARDemo 4b＋Quest）、`ed69f6b`（場景 2.1＋標籤）。Drive 白名單同步 18 檔。

## 未解決／待決
- `public/asembly/quest/cert_filled_1.png` 未進版控、程式未引用：提交或移待刪，待 PO。
- Codex 4b 最終版（14:42）QR 多柔化 0.75px，專案用的是 PO 審過的 14:39 版；是否換用待 PO（差異僅 QR 30px 區）。
- 其他四支（00 總覽、01 語音、03 記憶、05 掃描）仍為 07-22 渲染；07-22 10:19 退修 commit 晚於該批渲染，可能未反映（推測，未逐支比對）。
- W_04 p26 換圖後 PowerPoint 實開未驗。

## 下一步建議
- Studio：`cd git_mirror/Remotion_fun && npx remotion studio --port 3030`（本次在 mirror 跑，因 Drive 無 node_modules）。改動後記得白名單同步回 Drive。
- 若要重出其餘四支，先在 Studio 逐支看過再 render 到 `render_2026-10-05/`。
