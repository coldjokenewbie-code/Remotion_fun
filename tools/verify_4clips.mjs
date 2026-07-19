import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const clips = [
  ["AirRaidDemo.tsx", 1, "airraid", true, "qr_audio_0B7_badge.png"],
  ["ARDemo.tsx", 2, "ardemo", false, "qr_ar_G13_badge.png"],
  ["MemoryVoiceDemo.tsx", 3, "memory", true, "qr_memory_0B3_badge.png"],
  ["QuestDemo.tsx", 4, "quest", false, "qr_quest_gold.png"],
];

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

const readPngSize = (file) => {
  const buffer = fs.readFileSync(file);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const minimumScanSizes = {
  airraid: { width: 480, height: 1040 },
  ardemo: { width: 480, height: 1040 },
  memory: { width: 480, height: 1040 },
  quest: { width: 480, height: 1040 },
};

const expectedScanHashes = {
  airraid: "b0b4c4f1488a196538ab445ba18187860e7896fb25a87606a17899941dbbcd91",
  ardemo: "30e907cf773a862a28a4608630dff9f5917893b4ccd328bd0debabd40d4fc200",
  memory: "f6262a4f70e88b38db9474e62ab2c7b1c68e7c3ff676faa23638a632a9f741d9",
  quest: "7b4cec27c3ff3d8f29ed561aaa63f65165650883049fe1eb80e0df62add41827",
};

const narrationLimits = {
  airraid: [
    ["vo_airraid_guide_tw.mp3", 10, 12],
    ["vo_s3_ja_v2.mp3", 5, 7],
  ],
  memory: [["vo_memory_invite_tw.mp3", 7, 9]],
};

const getObjectBody = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\};`));
  return match?.[1] ?? "";
};

const qrPython = process.env.QR_PYTHON
  ?? "/private/tmp/ody-asembly-4clips-v7/venv/bin/python";

const checkQr = (scanPanel, qrReference) => {
  const result = spawnSync(qrPython, [
    "tools/check_qr_count.py",
    scanPanel,
    "--expect-count", "1",
    "--expect-from", qrReference,
  ], { encoding: "utf8" });
  if (result.status !== 0) {
    fail(`QR 機檢失敗 ${scanPanel}: ${result.stderr || result.stdout}`);
    return;
  }
  console.log(`PASS QR: ${result.stdout.trim()}`);
};

const checkNarrationDuration = (assetDir) => {
  const limits = narrationLimits[assetDir] ?? [];
  for (const [file, minSeconds, maxSeconds] of limits) {
    const audio = path.join("public/asembly", assetDir, file);
    const result = spawnSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio,
    ], { encoding: "utf8" });
    const seconds = Number(result.stdout.trim());
    if (result.status !== 0 || !Number.isFinite(seconds) || seconds < minSeconds || seconds > maxSeconds) {
      fail(`${file} 音長 ${result.stdout.trim() || "無法讀取"}s，須為 ${minSeconds}–${maxSeconds}s`);
      continue;
    }
    console.log(`PASS TTS: ${file} ${seconds.toFixed(2)}s（${minSeconds}–${maxSeconds}s）`);
  }
};

const checkAlignment = () => {
  const alignmentPython = process.env.ALIGN_PYTHON
    ?? "/private/tmp/ody-asembly-4clips-v7/venv/bin/python";
  const result = spawnSync(alignmentPython, ["tools/check_alignment.py"], { encoding: "utf8" });
  if (result.status !== 0) {
    fail(`對齊機檢失敗: ${result.stderr || result.stdout}`);
    return;
  }
  console.log(result.stdout.trim());
};

const indexSource = fs.readFileSync(path.join("src", "index.tsx"), "utf8");
const sharedSource = fs.readFileSync(path.join("src/asembly", "shared.tsx"), "utf8");
const panelPipeline = fs.readFileSync(path.join("tools", "make_scan_panel.py"), "utf8");
if (fs.existsSync(path.join("tools", "build_scan_panels_v7.py"))) fail("仍保留 v7 後貼 QR 腳本");
const hasSharedProjection = panelPipeline.includes("qr_to_panel = camera @ corner_pin")
  && panelPipeline.includes("camera = source_to_panel(item)")
  && panelPipeline.includes("corner_pin = qr_to_source(item, qr.shape)");
if (!hasSharedProjection) {
  fail("v7.2 未以同一相機矩陣投影原圖與 corner-pin QR");
}
if (/\.paste\s*\(/.test(panelPipeline)) fail("v7.2 禁止裁切後 paste QR");

for (const [file, index, assetDir, hasNarration, qrFile] of clips) {
  const source = fs.readFileSync(path.join("src/asembly", file), "utf8");
  const timeline = getObjectBody(source, "T");
  const start = Number(timeline.match(/functionStart:\s*(\d+)/)?.[1]);
  const phoneIn = Number(timeline.match(/phoneIn:\s*(\d+)/)?.[1]);
  const scanEnd = Number(timeline.match(/scanEnd:\s*(\d+)/)?.[1]);
  const total = Number(timeline.match(/total:\s*(\d+)/)?.[1]);
  const compositionId = path.basename(file, ".tsx");
  const registeredDuration = Number(indexSource.match(new RegExp(`id="${compositionId}"[\\s\\S]*?durationInFrames=\\{(\\d+)\\}`))?.[1]);
  const voices = Object.fromEntries([...getObjectBody(source, "VO").matchAll(/(\w+):\s*(\d+)/g)].map((match) => [match[1], Number(match[2])]));
  const audioKeys = [...source.matchAll(/<Sequence from=\{VO\.(\w+)\}><Audio/g)].map((match) => match[1]);
  if (!Number.isFinite(start)) fail(`${file} 缺少功能段常數`);
  // PO 20260720 語音配比指示：01 需容納中文 10–12s＋日文 5–7s，單獨放寬。
  const maxFrames = assetDir === "airraid" ? 780 : 600;
  if (total < 300 || total > maxFrames) fail(`${file} 總長 ${total}f 不在 300–${maxFrames}f`);
  if (total !== registeredDuration) fail(`${file} 總長 ${total}f 與 composition ${registeredDuration}f 不一致`);
  if (hasNarration && audioKeys.length === 0) fail(`${file} 缺少功能段 Audio`);
  if (!hasNarration && (audioKeys.length > 0 || /<Audio\b/.test(source))) fail(`${file} 不得含旁白 Audio`);
  for (const key of audioKeys) if (voices[key] < start) fail(`${file} 的 ${key} 音軌早於功能段`);
  if (/vo_s1_invite|vo_s2_guide(?:_v2)?|vo_q1/.test(source)) fail(`${file} 仍引用舊 edge-tts 旁白`);
  if (!source.includes(`TitleCard index={${index}}`) || !source.includes(`EndCard feature=`)) fail(`${file} 未套用統一版式`);
  if (/示範情境|走進工場故事|把它請回|你看，這就是|領回家/.test(source + sharedSource)) fail(`${file} 仍含行銷或情緒字卡`);
  if (!source.includes('ScanView bg={A("scan_panel.png")}')) fail(`${file} 未使用展板近拍掃描畫面`);
  const scanPanel = path.join("public/asembly", assetDir, "scan_panel.png");
  if (!fs.existsSync(scanPanel)) {
    fail(`${file} 缺少掃描近拍素材`);
  } else if (minimumScanSizes[assetDir]) {
    const actual = readPngSize(scanPanel);
    const minimum = minimumScanSizes[assetDir];
    if (actual.width < minimum.width || actual.height < minimum.height) {
      fail(`${file} 掃描近拍解析度 ${actual.width}×${actual.height}，低於 ${minimum.width}×${minimum.height}`);
    }
    const hash = crypto.createHash("sha256").update(fs.readFileSync(scanPanel)).digest("hex");
    if (hash !== expectedScanHashes[assetDir]) fail(`${file} 的 v7.2 scan_panel.png 與原圖空間基準不符`);
  }
  if (["airraid", "memory"].includes(assetDir)) {
    const scanFrames = scanEnd - (phoneIn + 10);
    const titleAt = Number(source.match(/TitleCard[^>]+enterFrame=\{(\d+)\}/)?.[1]);
    const qrAt = Number(source.match(/<SceneQrCallout[^>]+enterFrame=\{(\d+)\}/)?.[1]);
    if (scanFrames < 75) fail(`${file} 掃描動畫僅 ${scanFrames}f，須至少 75f`);
    if (!(titleAt < qrAt && qrAt < phoneIn && scanEnd === start)) fail(`${file} 開場未依標示卡→QR 示意→掃描→功能排序`);
    if (source.includes("不妨掃描")) fail(`${file} 仍含已刪除的「不妨掃描」句`);
  }
  if (assetDir === "airraid" && (!/app_jp/.test(source) || !/VO\.japanese/.test(source) || !/vo_s3_ja/.test(source))) fail(`${file} 未恢復完整日文段`);
  if (assetDir === "airraid" && (!source.includes("多語服務") || !source.includes("中・英・日"))) fail(`${file} 缺少多語服務字卡`);
  if (assetDir === "quest" && (!source.includes('A("cert_filled.png")') || source.includes('A("cert_paper.png")'))) fail(`${file} 手機完成頁未使用已填寫證書`);
  const audioResult = hasNarration ? `Audio >= ${start}f` : "無旁白 Audio";
  checkNarrationDuration(assetDir);
  checkQr(scanPanel, path.join("public/asembly", assetDir, qrFile));
  console.log(`PASS ${file}: ${audioResult}, 統一版式, 展板近拍`);
}

checkAlignment();
if (!process.exitCode) console.log("PASS 四支導覽靜態驗收");
