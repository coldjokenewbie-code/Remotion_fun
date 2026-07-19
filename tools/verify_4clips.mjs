import fs from "node:fs";
import path from "node:path";

const clips = [
  ["AirRaidDemo.tsx", 1, "airraid", true],
  ["ARDemo.tsx", 2, "ardemo", false],
  ["MemoryVoiceDemo.tsx", 3, "memory", true],
  ["QuestDemo.tsx", 4, "quest", false],
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

const getObjectBody = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\};`));
  return match?.[1] ?? "";
};

const indexSource = fs.readFileSync(path.join("src", "index.tsx"), "utf8");

for (const [file, index, assetDir, hasNarration] of clips) {
  const source = fs.readFileSync(path.join("src/asembly", file), "utf8");
  const timeline = getObjectBody(source, "T");
  const start = Number(timeline.match(/functionStart:\s*(\d+)/)?.[1]);
  const total = Number(timeline.match(/total:\s*(\d+)/)?.[1]);
  const compositionId = path.basename(file, ".tsx");
  const registeredDuration = Number(indexSource.match(new RegExp(`id="${compositionId}"[\\s\\S]*?durationInFrames=\\{(\\d+)\\}`))?.[1]);
  const voices = Object.fromEntries([...getObjectBody(source, "VO").matchAll(/(\w+):\s*(\d+)/g)].map((match) => [match[1], Number(match[2])]));
  const audioKeys = [...source.matchAll(/<Sequence from=\{VO\.(\w+)\}><Audio/g)].map((match) => match[1]);
  if (!Number.isFinite(start)) fail(`${file} 缺少功能段常數`);
  if (total !== registeredDuration) fail(`${file} 總長 ${total}f 與 composition ${registeredDuration}f 不一致`);
  if (hasNarration && audioKeys.length === 0) fail(`${file} 缺少功能段 Audio`);
  if (!hasNarration && (audioKeys.length > 0 || /<Audio\b/.test(source))) fail(`${file} 不得含旁白 Audio`);
  for (const key of audioKeys) if (voices[key] < start) fail(`${file} 的 ${key} 音軌早於功能段`);
  if (/vo_s1_invite|vo_s2_guide(?:_v2)?|vo_q1/.test(source)) fail(`${file} 仍引用舊 edge-tts 旁白`);
  if (!source.includes(`TitleCard index={${index}}`) || !source.includes(`EndCard feature=`)) fail(`${file} 未套用統一版式`);
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
  }
  const audioResult = hasNarration ? `Audio >= ${start}f` : "無旁白 Audio";
  console.log(`PASS ${file}: ${audioResult}, 統一版式, 展板近拍`);
}

if (!process.exitCode) console.log("PASS 四支導覽靜態驗收");
