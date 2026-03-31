import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import {mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {
  rommzProductLaunchHybridCaptureIds,
  rommzProductLaunchHybridCaptureManifest,
  type RommzProductLaunchHybridCaptureId,
} from "../../src/remotion/captures/rommzProductLaunchHybridCaptures.ts";
import {
  buildRommzProductLaunchHybridPayload,
  type RommzProductLaunchHybridSnapshot,
} from "../../src/remotion/payloads/buildRommzProductLaunchHybridPayload.ts";
import {ensureGeneratedRommzProductLaunchHybridAudio} from "./generateProductLaunchHybridAudio.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_DIR = resolve(__dirname, "..", "..");
const ROOT_DIR = resolve(WEB_DIR, "..", "..");
const CAPTURE_DIR = resolve(WEB_DIR, ".tmp", "remotion", "captures");
const PAYLOAD_PATH = resolve(WEB_DIR, ".tmp", "remotion", "rommz-product-launch-hybrid.payload.json");

type Mode = "capture" | "payload" | "render" | "still";

type Args = {
  captureFirst: boolean;
  generateAudioFirst: boolean;
  mode: Mode;
  outputPath?: string;
  stillFrame: number;
  soundtrackSrc?: string;
  useGeneratedAudio: boolean;
  useFixture: boolean;
  voiceoverSrc?: string;
};

const ENV_FILES = [
  resolve(ROOT_DIR, ".env"),
  resolve(ROOT_DIR, ".env.local"),
  resolve(WEB_DIR, ".env"),
  resolve(WEB_DIR, ".env.local"),
];

const DEFAULT_STILL_OUTPUT = "remotion-renders/rommz-product-launch-hybrid-16x9.png";
const DEFAULT_VIDEO_OUTPUT = "remotion-renders/rommz-product-launch-hybrid-16x9.mp4";

const parseArgs = (argv: string[]): Args => {
  const parsed: Args = {
    captureFirst: false,
    generateAudioFirst: false,
    mode: "payload",
    stillFrame: 240,
    useGeneratedAudio: false,
    useFixture: false,
  };

  for (const entry of argv) {
    if (entry === "--capture") {
      parsed.mode = "capture";
      continue;
    }

    if (entry === "--payload") {
      parsed.mode = "payload";
      continue;
    }

    if (entry === "--still") {
      parsed.mode = "still";
      continue;
    }

    if (entry === "--render") {
      parsed.mode = "render";
      continue;
    }

    if (entry === "--capture-first") {
      parsed.captureFirst = true;
      continue;
    }

    if (entry === "--generate-audio-first") {
      parsed.generateAudioFirst = true;
      continue;
    }

    if (entry === "--use-generated-audio") {
      parsed.useGeneratedAudio = true;
      continue;
    }

    if (entry === "--use-fixture") {
      parsed.useFixture = true;
      continue;
    }

    if (entry.startsWith("--out=")) {
      parsed.outputPath = entry.slice("--out=".length);
      continue;
    }

    if (entry.startsWith("--frame=")) {
      const value = Number(entry.slice("--frame=".length));
      if (Number.isFinite(value) && value >= 0) {
        parsed.stillFrame = Math.floor(value);
      }
      continue;
    }

    if (entry.startsWith("--voiceover=")) {
      parsed.voiceoverSrc = entry.slice("--voiceover=".length);
      continue;
    }

    if (entry.startsWith("--soundtrack=")) {
      parsed.soundtrackSrc = entry.slice("--soundtrack=".length);
    }
  }

  return parsed;
};

const loadEnvFiles = async () => {
  for (const envFile of ENV_FILES) {
    if (!existsSync(envFile)) {
      continue;
    }

    const content = await readFile(envFile, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
};

const capturePath = (captureId: RommzProductLaunchHybridCaptureId) => {
  return resolve(CAPTURE_DIR, rommzProductLaunchHybridCaptureManifest[captureId].fileName);
};

const writePayloadSnapshot = async (payload: unknown) => {
  await mkdir(dirname(PAYLOAD_PATH), {recursive: true});
  await writeFile(PAYLOAD_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const cleanCaptureOutput = async () => {
  await mkdir(CAPTURE_DIR, {recursive: true});

  await Promise.all(
    rommzProductLaunchHybridCaptureIds.map(async (captureId) => {
      await rm(capturePath(captureId), {force: true});
    }),
  );
};

const runCaptureCommand = async () => {
  await cleanCaptureOutput();

  const result = spawnSync(
    "npx",
    [
      "playwright",
      "test",
      "--config",
      "./playwright.config.ts",
      "tests/e2e/remotion-product-launch-capture.spec.ts",
      "--workers=1",
    ],
    {
      cwd: WEB_DIR,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ROMMZ_CAPTURE_OUTPUT_DIR: CAPTURE_DIR,
      },
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const readCaptureDataUrls = async () => {
  const missingCaptureIds = rommzProductLaunchHybridCaptureIds.filter((captureId) => !existsSync(capturePath(captureId)));
  if (missingCaptureIds.length > 0) {
    throw new Error(`Missing required captures: ${missingCaptureIds.join(", ")}`);
  }

  const entries = await Promise.all(
    rommzProductLaunchHybridCaptureIds.map(async (captureId) => {
      const content = await readFile(capturePath(captureId));
      return [captureId, `data:image/png;base64,${content.toString("base64")}`] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<RommzProductLaunchHybridCaptureId, string>;
};

const runRemotionCommand = (args: Args) => {
  const outputPath =
    args.outputPath ??
    (args.mode === "still" ? DEFAULT_STILL_OUTPUT : DEFAULT_VIDEO_OUTPUT);
  const remotionArgs =
    args.mode === "still"
      ? [
          "remotion",
          "still",
          "src/remotion/index.ts",
          "RommzProductLaunchHybrid16x9",
          outputPath,
          `--props=${PAYLOAD_PATH}`,
          `--frame=${args.stillFrame}`,
        ]
      : [
          "remotion",
          "render",
          "src/remotion/index.ts",
          "RommzProductLaunchHybrid16x9",
          outputPath,
          `--props=${PAYLOAD_PATH}`,
        ];

  const result = spawnSync("npx", remotionArgs, {
    cwd: WEB_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const main = async () => {
  await loadEnvFiles();

  const args = parseArgs(process.argv.slice(2));
  let generatedAudio:
    | Awaited<ReturnType<typeof ensureGeneratedRommzProductLaunchHybridAudio>>
    | undefined;

  if (args.mode === "capture") {
    await runCaptureCommand();
    console.log(`[remotion-product-launch] captures: ${CAPTURE_DIR}`);
    return;
  }

  if (args.generateAudioFirst || args.useGeneratedAudio) {
    generatedAudio = await ensureGeneratedRommzProductLaunchHybridAudio();

    for (const warning of generatedAudio.warnings) {
      console.warn(`[remotion-product-launch] audio warning: ${warning}`);
    }
  }

  if (args.captureFirst && !args.useFixture) {
    await runCaptureCommand();
  }

  const resolvedVoiceoverSrc = args.voiceoverSrc ?? generatedAudio?.voiceoverSrc;
  const resolvedSoundtrackSrc = args.soundtrackSrc ?? generatedAudio?.soundtrackSrc;

  const snapshot: RommzProductLaunchHybridSnapshot = args.useFixture
    ? {
        dataSource: "fixture",
        capturedAt: new Date().toISOString(),
        warnings: ["Local hybrid render forced fixture mode with --use-fixture."],
        audio: {
          soundtrackSrc: resolvedSoundtrackSrc,
          voiceoverSrc: resolvedVoiceoverSrc,
        },
      }
    : {
        dataSource: "captures",
        capturedAt: new Date().toISOString(),
        captures: await readCaptureDataUrls(),
        audio: {
          soundtrackSrc: resolvedSoundtrackSrc,
          voiceoverSrc: resolvedVoiceoverSrc,
        },
      };

  const payload = buildRommzProductLaunchHybridPayload(snapshot);
  await writePayloadSnapshot(payload);

  console.log(`[remotion-product-launch] payload: ${PAYLOAD_PATH}`);
  console.log(`[remotion-product-launch] source: ${snapshot.dataSource}`);

  if (args.mode === "still" || args.mode === "render") {
    runRemotionCommand(args);
  }
};

await main();
