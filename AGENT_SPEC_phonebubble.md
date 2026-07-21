# SPEC：手機拉出示意改版——白色氣泡樣式（契約 asembly-phonebubble-keyframe-20260721）

## 目標
PO 退修現行「楔形光束」示意（兩版皆不過）：
- v1（不透明大楔形）：太醜、量體過大。
- v2（半透明漸層光束）：看不出想表達什麼；且斜向光束邊線橫過手機區，畫面被讀成「手機內容變斜」。

構圖參考 PO 附圖（`refs_po/bubble_reference.png`）：**拉框呈現「右側是手機操作畫面」，楔形尾巴從展板 QR 定點收窄連到框**。`refs_po/current_bad.png` 是被退的現行畫面，供對照。

**PO 修訂（2026-07-21）**：框不一定要白色不透明——重點是「拉出的框」語意清楚＋有設計感。採以下方向：

## 本階段範圍
只改 `src/asembly/shared.tsx` 與 `src/asembly/ARDemo.tsx`（關鍵幀先給 PO 核可，其餘三支之後才套）。其餘檔案不得壞編譯。

## 設計規格
1. 新元件 `PhoneBubble`（放 shared.tsx；**不要動既有 `PhoneCallout`**，其他三支還在用）：
   - **磨砂玻璃卡片**（glassmorphism）：圓角矩形（圓角 ~28-36px），`background: rgba(250,252,255,0.68)`＋`backdropFilter: blur(20px) saturate(1.15)`、1.5px 白邊（rgba(255,255,255,0.9)）、深柔投影。佔畫面右側（建議 left≈1140、top≈70、寬≈690、高≈940，內部再微調）。畫面透出微糊背景→比純白輕盈，又足夠亮、可辨「這是拉出的面板」。
   - **標籤章**：卡片左上角外緣掛一枚小 chip，沿用本系列 TitleCard 設計語彙（深色底 rgba(15,18,25,0.86)＋左側 4px 橘 #ff8a3d 邊＋白字），文字「手機操作畫面」，字級 ~20px。這是讓委員一眼懂的關鍵。
   - **楔形尾巴**：從展板 QR 錨點（小圓圈）收窄連至卡片左緣（接點高度約卡片上緣 1/4~1/3 處），填色與卡片一致（同 rgba＋若能 backdropFilter 一致更好；SVG polygon 無法 backdrop-blur 就用半透明白 rgba(250,252,255,0.55)＋1.5px 白描邊），與卡片視覺一體。
   - 卡片、chip、尾巴同步淡入淡出：`visibleFrom`/`visibleTo` props，各 ~12 幀。
   - ⚠️ `backdropFilter` 在 Remotion headless Chromium 需實測；若 blur 無效（背景不糊），fallback：`background: rgba(250,252,255,0.9)` 純半透明、不留 backdropFilter。你改完後由 Claude 抽幀確認，必要時回你修。
2. 手機放氣泡內：ARDemo 的 `PhoneFrame`（含 hand_hold 手部素材、ScanView/App 截圖）移入氣泡容器內置中偏右，**完全正置：不得有任何 rotate/skew/perspective**。
   - 手部素材超出氣泡的部分要被氣泡邊界裁掉（參考圖手在氣泡下緣被裁）。
   - ⚠️ 已知坑（lessons #26）：Chromium 對「外層有 transform 的容器」`overflow:hidden` 裁切可能失效。PhoneFrame 本身用 translate/scale transform。務必用可靠裁切法（如氣泡容器不帶 transform、或 clip-path），並自行說明採用了哪種。
3. ARDemo 時序：氣泡 `visibleFrom=T.phoneIn`、`visibleTo=T.fadeOut`（手機在場全程都在氣泡內，不是只有掃描段）。原 `PhoneCallout` 呼叫移除。
4. 錨點沿用 `PHONE_ANCHOR = {x:236, y:550}`（scene3 zoom 後展板 QR 的實測畫布座標）。
5. 掃描完成後的 App 分頁（app_ar_before/after）與 FingerTap 點按流程照舊，只是整組移進氣泡。

## 驗收（契約 5 條對應）
1. 視覺同參考圖構圖（Claude 抽幀後 PO 核可）。
2. `grep -n "rotate\|skew\|perspective" src/asembly/shared.tsx src/asembly/ARDemo.tsx` 無新增命中（drop-shadow 等非 transform 者不算）。
3. 抽幀後氣泡邊界外無手部膚色像素帶（Claude 機檢）。
4. `npx remotion still src/index.tsx ARDemo /tmp/ody_ar_key.png --frame=55` exit 0（Claude 代跑，codex 沙箱擋 Chromium——你只改碼，不必自己 render）。
5. `npx remotion still src/index.tsx AirRaidDemo ... --frame=79` exit 0（其他三支不壞編譯）。

## 完成回報
改完列出：改了哪些檔、裁切手法、氣泡幾何常數（供 Claude 抽幀驗證與微調）。不寫 AGENT_SIGNAL.log，直接以 stdout 回報。

---

## Round 2 退修（PO 2026-07-21 檢視 f55 關鍵幀，5 點）

排版方向過（"排版有進步"），以下逐點修：

1. **面板改深色玻璃**（根治「手出現奇怪變異」）：亮底讓手素材繞機身的指尖失去手掌脈絡、被讀成懸浮肉塊；v7.3 核可版在暗場景上判讀正常。面板改 `background: rgba(15,18,25,0.62)`＋`backdropFilter: blur(20px)`、保留 1.5px 白邊與投影（與本系列 TitleCard 深色玻璃語彙一致）。楔形尾巴同步改深色半透明（如 rgba(15,18,25,0.5)）＋細白描邊。手素材照舊用 `hand_hold.png` 原樣組合，**不要**改素材、不要另生手。
2. **手機＋手置中**：手＋手機視覺群組在面板內水平置中（手掌在機身右側，故手機中心可略偏左；PhoneFrame `x` 微調即可）；垂直向下移一點，讓手掌/手腕從面板**右緣偏下～底右角**被裁出去（同參考圖語感），避免手腕斷頭懸浮在面板中。
3. **標籤收進面板內**：「手機操作畫面」chip 移入面板內部左上（inset ~14px），不得跨在面板邊框上。
4. **背景突變重疊**（scene 交叉淡變鬼影，PO 圈了訪客與展板兩處）：ARDemo 時序改——scene1→2 淡變縮到 8 幀、scene2→3 淡變 8 幀且於 phoneIn 前收完（建議 s2aStart=30、s2bStart=44、phoneIn=58）；掃描窗順延（scan 從 phoneIn+10 到 scanEnd=120，`T.scanEnd` 改 120；字幕/arTap 不動）。原則：**面板在場時背景必須是穩定單一場景**。
5. **移除編號**：TitleCard 的「導覽功能 0X / 04」與 EndCard 的「導覽功能 0X/04」一律改純「導覽功能」（導覽功能只是其中幾項，不編號）；`index` prop 可留但不顯示，四支共用元件一次改。EndCard `isFinal` 的「組立工場行動導覽」不動。

驗收補充（併入契約條 1 重驗）：新關鍵幀 f70（穩定 scene3 背景）＋f300 抽幀，手無斷頭懸浮、面板外無殘指細條誤讀、chip 在面板內、無場景鬼影、標示卡無編號。

---

## Rollout（PO 已核可 ARDemo 關鍵幀「OK 其他比照修改」；契約 asembly-phonebubble-rollout-20260721）

把 ARDemo 定稿樣式比照套用到 AirRaidDemo / MemoryVoiceDemo / QuestDemo（ARDemo 本身不要再動）：

**定稿樣式（參照 ARDemo.tsx 現行寫法）**：
- `PhoneBubble`（shared.tsx 現行版：灰面板 600×900@(1180,90)、L 形虛線拉線、chip「手機操作畫面」）＋ `PhoneAssetFrame src=hand_po.png left={-76} top={10}`（各片 public 目錄已放好 hand_po.png）。
- 移除三支的 `PhoneCallout` 呼叫與 `PhoneFrame` 手機（含 hand_hold.png 用法）；screen children（ScanView/app 截圖）原樣搬進 PhoneAssetFrame。
- PhoneBubble `visibleFrom=T.phoneIn`、`visibleTo=T.fadeOut`。

**各片專屬**：
1. **AirRaidDemo**：anchor 沿用 PHONE_ANCHOR(240,605)。時序退鬼影：s2a 淡變 8 幀、s2b 淡變 8 幀且於 phoneIn 前收完（建議 s2aStart=36 淡至 44、s2bStart=50 淡至 58、phoneIn=62）；scanEnd=160 與 VO.guide=160 不動。MultiLanguageCard／字幕／音軌不動。
2. **MemoryVoiceDemo**：anchor 沿用 PHONE_ANCHOR(123,462)。同樣 8 幀淡變、phoneIn 移到淡變後（建議 s2bStart=50 淡至 58、phoneIn=62）；scanEnd=150 與 VO 不動。
3. **QuestDemo**：手機全程在場（phoneIn=20 不動），PhoneBubble visibleFrom=20 visibleTo=T.fadeOut。**拉線只在機台掃描段顯示**（drillBg=230 → progAt+10）——PhoneBubble 需加可選 prop（如 leaderWindow?: {from,to}，未給則全程顯示），anchor=SCENE_QR(605,598)。場景淡變（playIn/KioskBg）縮到 8 幀。SceneQrCallout 金 QR 卡照舊。
4. ARDemo 的 FingerTap 已重對位（target 381,712 scale 0.87），其他三支無 FingerTap。

**驗收**（契約 5 條）：無 PhoneCallout 殘留（grep）；淡變時序如上；Quest 拉線僅掃描段；四支抽幀（掃描段＋內容段、spring 落定幀）無鬼影/手變異/面板外膚色；verifier 複驗。

---

## Round 3 退修（PO 2026-07-21 檢視 R2 關鍵幀，附新參考圖 refs_po/panel_reference_r3.png）

1. **面板底色改中灰半透明**：深色玻璃跟黑色手機太接近、分不開。照新參考圖改亮一階的灰：`background: rgba(208,212,218,0.62)`＋`backdropFilter: blur(16px)`，邊框改極淡或移除（參考圖無明顯邊框），圓角維持。手機黑框在中灰底上輪廓清楚，且手部素材在中灰底上仍可判讀（比純白safe）。
2. **移除錨點圓圈**：場景 QR 處已有聚光 highlight，PhoneBubble 不要再畫白圈（兩層 circle 全刪）。
3. **楔形尾巴改「虛線拉線」**：實心楔形刪除，改虛線 leader line，線格式**完全比照 SceneQrCallout 既有拉線**（`stroke="#fff" strokeWidth={3.5} strokeDasharray="10 7"`）。路徑照參考圖走 L 形：QR 下方 →垂直下到近地面（y≈930）→水平右行→接面板左緣底角。實作成 SVG polyline 三點：`(anchor.x, anchor.y+45) → (anchor.x, 930) → (panel.left-6, 930)`，端點可微調。
4. chip「手機操作畫面」與 R2 幾何（手機 x-65/y30/scale0.96、時序）不動。
