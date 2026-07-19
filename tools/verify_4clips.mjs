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
  airraid: "a882a3e0901aae2eb70f15539fe635cd99c3e6d10d296aec53224259ab9a3c66",
  ardemo: "e0fe92f87b19fcc60dabbad6f7225501be2dfbabd334cd49edac51acc5450315",
  memory: "55210726067e31a7991881d5a36f5c4b94aff1823ea45f785d834ae7d47d8f18",
  quest: "438aa1d65f9b20e237df9de0f70db8f55df49bcafa0a2af7d1e118042481f983",
};

const narrationLimits = {
  airraid: ["vo_airraid_guide_tw.mp3", 14],
  memory: ["vo_memory_invite_tw.mp3", 9],
};

const getObjectBody = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\};`));
  return match?.[1] ?? "";
};

const qrPython = process.env.QR_PYTHON
  ?? "/private/tmp/ody-asembly-4clips-v6/venv/bin/python";

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
  const limit = narrationLimits[assetDir];
  if (!limit) return;
  const [file, maxSeconds] = limit;
  const audio = path.join("public/asembly", assetDir, file);
  const result = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio,
  ], { encoding: "utf8" });
  const seconds = Number(result.stdout.trim());
  if (result.status !== 0 || !Number.isFinite(seconds) || seconds > maxSeconds) {
    fail(`${file} 音長 ${result.stdout.trim() || "無法讀取"}s，須 <= ${maxSeconds}s`);
    return;
  }
  console.log(`PASS TTS: ${file} ${seconds.toFixed(2)}s <= ${maxSeconds}s`);
};

const indexSource = fs.readFileSync(path.join("src", "index.tsx"), "utf8");
const sharedSource = fs.readFileSync(path.join("src/asembly", "shared.tsx"), "utf8");

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
  if (total < 300 || total > 600) fail(`${file} 總長 ${total}f 不在 300–600f`);
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
    if (hash !== expectedScanHashes[assetDir]) fail(`${file} 的 scan_panel.png 在第二輪遭修改`);
  }
  if (["airraid", "memory"].includes(assetDir)) {
    const scanFrames = scanEnd - (phoneIn + 10);
    const titleAt = Number(source.match(/TitleCard[^>]+enterFrame=\{(\d+)\}/)?.[1]);
    const qrAt = Number(source.match(/<QrCallout enterFrame=\{(\d+)\}/)?.[1]);
    if (scanFrames < 75) fail(`${file} 掃描動畫僅 ${scanFrames}f，須至少 75f`);
    if (!(titleAt < qrAt && qrAt < phoneIn && scanEnd === start)) fail(`${file} 開場未依標示卡→QR 示意→掃描→功能排序`);
    if (!source.includes("不妨掃描")) fail(`${file} 未保留克制邀約語`);
  }
  if (assetDir === "airraid" && /app_jp|VO\.japanese|vo_s3_ja/.test(source)) fail(`${file} 自行恢復日文段`);
  if (assetDir === "quest" && (!source.includes('A("cert_filled.png")') || source.includes('A("cert_paper.png")'))) fail(`${file} 手機完成頁未使用已填寫證書`);
  const audioResult = hasNarration ? `Audio >= ${start}f` : "無旁白 Audio";
  checkNarrationDuration(assetDir);
  checkQr(scanPanel, path.join("public/asembly", assetDir, qrFile));
  console.log(`PASS ${file}: ${audioResult}, 統一版式, 展板近拍`);
}

if (!process.exitCode) console.log("PASS 四支導覽靜態驗收");
