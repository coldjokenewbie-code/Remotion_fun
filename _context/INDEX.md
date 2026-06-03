# Remotion_fun — 現況總覽 (INDEX)
> 進場先讀。最後更新：2026-06-03

## 一句話目標
Remotion 程式化動畫實驗 repo（package: `remotion_fun`）。目前含車床動畫（Lathe）與世界旅遊地圖（WorldTripMap）兩支實驗。

## 目前狀態 / 進度
- 程式碼 repo（git，**master 分支**）。來源：`src/LatheScene.tsx`、`src/WorldTripMap.tsx`、`src/index.tsx`。
- 素材：`BlankMap-World.svg`（世界地圖）、`public/`。
- 啟動：`npm start`（remotion studio）；輸出範例：`npm run build`（render LatheAnimation → `out/lathe.mp4`）。
- 無 README、_context 文件；package description 空白。實驗性質（推測）。

## 關鍵檔案
- 設定：`remotion.config.ts`、`tsconfig.json`、`package.json`
- 規則：`rules/`（若有內容）
- 來源：`src/`

## 待辦 / 下一步
- 無明確交接文件；接手請先看 `src/` 各 composition 與 `package.json` scripts。

## 備註
- skills：本 repo 不放共用 skill，靠全域 `~/.claude/skills`（混合架構）；目前無專屬 skill。
- 分支為 `master`（其餘 repo 多為 `main`）。
- 與 claude_CDIC_O4（正式 Remotion 影片案）為不同 repo；此處偏實驗/練習（推測）。
