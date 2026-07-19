import fs from "node:fs";
import path from "node:path";

const clips = [
  ["AirRaidDemo.tsx", 1, "airraid"],
  ["ARDemo.tsx", 2, "ardemo"],
  ["MemoryVoiceDemo.tsx", 3, "memory"],
  ["QuestDemo.tsx", 4, "quest"],
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
  ardemo: { width: 480, height: 1040 },
  memory: { width: 480, height: 1040 },
};

const getObjectBody = (source, name) => {
  const match = source.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\};`));
  return match?.[1] ?? "";
};

for (const [file, index, assetDir] of clips) {
  const source = fs.readFileSync(path.join("src/asembly", file), "utf8");
  const start = Number(getObjectBody(source, "T").match(/functionStart:\s*(\d+)/)?.[1]);
  const voices = Object.fromEntries([...getObjectBody(source, "VO").matchAll(/(\w+):\s*(\d+)/g)].map((match) => [match[1], Number(match[2])]));
  const audioKeys = [...source.matchAll(/<Sequence from=\{VO\.(\w+)\}><Audio/g)].map((match) => match[1]);
  if (!Number.isFinite(start) || audioKeys.length === 0) fail(`${file} 缺少功能段或 Audio 常數`);
  for (const key of audioKeys) if (voices[key] < start) fail(`${file} 的 ${key} 音軌早於功能段`);
  if (/vo_.*invite|vo_q1/.test(source)) fail(`${file} 仍引用開場旁白`);
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
  console.log(`PASS ${file}: Audio >= ${start}f, 統一版式, 展板近拍`);
}

if (!process.exitCode) console.log("PASS 四支導覽靜態驗收");
