import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import {mkdir, rm, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {rommzProductLaunchHybridFixture} from "../../src/remotion/compositions/rommzProductLaunchHybrid.schema.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_DIR = resolve(__dirname, "..", "..");
const PUBLIC_AUDIO_DIR = resolve(WEB_DIR, "public", "remotion", "audio");
const TMP_AUDIO_DIR = resolve(WEB_DIR, ".tmp", "remotion", "audio");

const EDGE_VOICEOVER_FILE_NAME = "rommz-product-launch-hybrid-preview-voiceover.vi.mp3";
const POWERSHELL_VOICEOVER_FILE_NAME = "rommz-product-launch-hybrid-preview-voiceover.fallback.wav";
const SOUNDTRACK_FILE_NAME = "rommz-product-launch-hybrid-preview-bed.wav";
const SCRIPT_FILE_NAME = "rommz-product-launch-hybrid-preview-voiceover.txt";
const MANIFEST_FILE_NAME = "rommz-product-launch-hybrid-preview-audio.json";

const DEFAULT_EDGE_TTS_VOICE = "vi-VN-HoaiMyNeural";

export const rommzProductLaunchHybridPreviewSoundtrackSrc = `/remotion/audio/${SOUNDTRACK_FILE_NAME}`;
export const rommzProductLaunchHybridPreviewVietnameseVoiceoverSrc =
  `/remotion/audio/${EDGE_VOICEOVER_FILE_NAME}`;
export const rommzProductLaunchHybridPreviewFallbackVoiceoverSrc =
  `/remotion/audio/${POWERSHELL_VOICEOVER_FILE_NAME}`;
export const rommzProductLaunchHybridPreviewSoundtrackPath = resolve(PUBLIC_AUDIO_DIR, SOUNDTRACK_FILE_NAME);
export const rommzProductLaunchHybridPreviewVietnameseVoiceoverPath = resolve(
  PUBLIC_AUDIO_DIR,
  EDGE_VOICEOVER_FILE_NAME,
);
export const rommzProductLaunchHybridPreviewFallbackVoiceoverPath = resolve(
  PUBLIC_AUDIO_DIR,
  POWERSHELL_VOICEOVER_FILE_NAME,
);

type AudioGeneratorArgs = {
  rate: number;
  voiceName?: string;
};

type VoiceoverGenerationResult =
  | {
      ok: false;
      warning: string;
    }
  | {
      ok: true;
      provider: "edge-tts" | "powershell";
      voiceName?: string;
      voiceoverPath: string;
      voiceoverSrc: string;
    };

export type GeneratedRommzProductLaunchHybridAudio = {
  manifestPath: string;
  provider?: "edge-tts" | "powershell";
  scriptPath: string;
  soundtrackSrc: string;
  voiceName?: string;
  voiceoverSrc?: string;
  warnings: string[];
};

const DEFAULT_ARGS: AudioGeneratorArgs = {
  rate: -2,
};

const parseArgs = (argv: string[]): AudioGeneratorArgs => {
  const parsed: AudioGeneratorArgs = {
    ...DEFAULT_ARGS,
  };

  for (const entry of argv) {
    if (entry.startsWith("--voice=")) {
      parsed.voiceName = entry.slice("--voice=".length).trim();
      continue;
    }

    if (entry.startsWith("--rate=")) {
      const rate = Number(entry.slice("--rate=".length));
      if (Number.isFinite(rate)) {
        parsed.rate = Math.max(-10, Math.min(10, Math.round(rate)));
      }
    }
  }

  return parsed;
};

const escapeXml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const buildVoiceoverScript = () => {
  return rommzProductLaunchHybridFixture.scenes
    .map((scene, index) => `${index + 1}. ${scene.voiceoverText}`)
    .join("\n\n");
};

const toEdgeTtsRate = (rate: number) => {
  const percent = rate * 4;
  return `${percent >= 0 ? "+" : ""}${percent}%`;
};

const buildVoiceoverSsml = (voiceName?: string) => {
  const sceneBlocks = rommzProductLaunchHybridFixture.scenes
    .map((scene) => `<s>${escapeXml(scene.voiceoverText)}</s><break time="650ms" />`)
    .join("");

  const voiceOpen = voiceName ? `<voice name="${escapeXml(voiceName)}">` : "";
  const voiceClose = voiceName ? "</voice>" : "";

  return [
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">',
    voiceOpen,
    "<prosody rate=\"-8%\">",
    sceneBlocks,
    "</prosody>",
    voiceClose,
    "</speak>",
  ].join("");
};

const writeWaveFile = async ({
  channelCount,
  outputPath,
  sampleRate,
  samples,
}: {
  channelCount: number;
  outputPath: string;
  sampleRate: number;
  samples: Int16Array;
}) => {
  const bytesPerSample = 2;
  const byteRate = sampleRate * channelCount * bytesPerSample;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(samples[index] ?? 0, 44 + index * bytesPerSample);
  }

  await writeFile(outputPath, buffer);
};

const createAmbientBed = async (outputPath: string) => {
  const fps = rommzProductLaunchHybridFixture.timing.fps;
  const durationInFrames = rommzProductLaunchHybridFixture.scenes.reduce(
    (total, scene) => total + scene.durationInFrames,
    0,
  );
  const durationInSeconds = durationInFrames / fps;
  const sampleRate = 24_000;
  const sampleCount = Math.ceil(durationInSeconds * sampleRate);
  const samples = new Int16Array(sampleCount);
  const progression = [
    [174.61, 220.0, 261.63],
    [196.0, 246.94, 293.66],
    [164.81, 207.65, 246.94],
    [220.0, 277.18, 329.63],
  ];
  const segmentDuration = durationInSeconds / progression.length;

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const time = sampleIndex / sampleRate;
    const segmentIndex = Math.min(
      progression.length - 1,
      Math.floor(time / segmentDuration),
    );
    const chord = progression[segmentIndex] ?? progression[0];
    const localTime = time % segmentDuration;
    const crossfade = Math.min(1, Math.max(0, localTime / 2));
    const envelope =
      Math.min(1, time / 2.8) *
      Math.min(1, (durationInSeconds - time) / 2.8);
    const flutter = 0.92 + 0.08 * Math.sin(Math.PI * 2 * 0.11 * time);
    const shimmer = 0.5 + 0.5 * Math.sin(Math.PI * 2 * 0.037 * time);

    const tone =
      0.48 * Math.sin(Math.PI * 2 * chord[0] * time) +
      0.34 * Math.sin(Math.PI * 2 * chord[1] * time * flutter) +
      0.22 * Math.sin(Math.PI * 2 * chord[2] * time * (1.003 + shimmer * 0.004));

    const pulse = 0.78 + 0.22 * Math.sin(Math.PI * 2 * 0.18 * time + crossfade);
    const sample = tone * envelope * pulse * 0.13;
    samples[sampleIndex] = Math.max(-1, Math.min(1, sample)) * 0x7fff;
  }

  await writeWaveFile({
    channelCount: 1,
    outputPath,
    sampleRate,
    samples,
  });
};

const generateVoiceoverWithEdgeTts = async ({
  outputPath,
  rate,
  scriptPath,
  voiceName,
}: {
  outputPath: string;
  rate: number;
  scriptPath: string;
  voiceName?: string;
}): Promise<VoiceoverGenerationResult> => {
  const result = spawnSync(
    "python",
    [
      "-m",
      "edge_tts",
      "--file",
      scriptPath,
      "--voice",
      voiceName ?? DEFAULT_EDGE_TTS_VOICE,
      "--rate",
      toEdgeTtsRate(rate),
      "--write-media",
      outputPath,
    ],
    {
      cwd: WEB_DIR,
      encoding: "utf8",
    },
  );

  if (result.error) {
    return {
      ok: false,
      warning: result.error.message,
    } as const;
  }

  if (result.status !== 0) {
    return {
      ok: false,
      warning: result.stderr.trim() || "edge-tts Vietnamese voiceover generation failed.",
    } as const;
  }

  if (!existsSync(outputPath)) {
    return {
      ok: false,
      warning: "edge-tts finished without producing the Vietnamese voiceover file.",
    } as const;
  }

  return {
    ok: true,
    provider: "edge-tts",
    voiceName: voiceName ?? DEFAULT_EDGE_TTS_VOICE,
    voiceoverPath: outputPath,
    voiceoverSrc: rommzProductLaunchHybridPreviewVietnameseVoiceoverSrc,
  } as const;
};

const generateVoiceoverWithPowerShell = async ({
  outputPath,
  rate,
  ssmlPath,
  voiceName,
}: {
  outputPath: string;
  rate: number;
  ssmlPath: string;
  voiceName?: string;
}): Promise<VoiceoverGenerationResult> => {
  if (process.platform !== "win32") {
    return {
      ok: false,
      warning: "Local preview voiceover generation is only wired for Windows PowerShell.",
    } as const;
  }

  const psScriptPath = resolve(TMP_AUDIO_DIR, "generate-product-launch-voiceover.ps1");
  const psScript = [
    "param(",
    "  [string]$OutputPath,",
    "  [string]$SsmlPath,",
    "  [string]$VoiceName,",
    "  [int]$Rate",
    ")",
    "",
    "$ErrorActionPreference = 'Stop'",
    "Add-Type -AssemblyName System.Speech",
    "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    "try {",
    "  if ($VoiceName) {",
    "    $available = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }",
    "    if ($available -contains $VoiceName) {",
    "      $synth.SelectVoice($VoiceName)",
    "    }",
    "  }",
    "  $synth.Rate = $Rate",
    "  $synth.SetOutputToWaveFile($OutputPath)",
    "  $ssml = Get-Content -Path $SsmlPath -Raw -Encoding utf8",
    "  $synth.SpeakSsml($ssml)",
    "  Write-Output $synth.Voice.Name",
    "} finally {",
    "  $synth.Dispose()",
    "}",
  ].join("\n");

  await writeFile(psScriptPath, psScript, "utf8");

  const result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      psScriptPath,
      "-OutputPath",
      outputPath,
      "-SsmlPath",
      ssmlPath,
      "-VoiceName",
      voiceName ?? "",
      "-Rate",
      String(rate),
    ],
    {
      cwd: WEB_DIR,
      encoding: "utf8",
    },
  );

  if (result.error) {
    return {
      ok: false,
      warning: result.error.message,
    } as const;
  }

  if (result.status !== 0) {
    return {
      ok: false,
      warning: result.stderr.trim() || "PowerShell preview voiceover generation failed.",
    } as const;
  }

  const selectedVoice = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!existsSync(outputPath)) {
    return {
      ok: false,
      warning: "PowerShell finished without producing the preview voiceover file.",
    } as const;
  }

  return {
    ok: true,
    provider: "powershell",
    voiceName: selectedVoice,
    voiceoverPath: outputPath,
    voiceoverSrc: rommzProductLaunchHybridPreviewFallbackVoiceoverSrc,
  } as const;
};

export const ensureGeneratedRommzProductLaunchHybridAudio = async (
  args: Partial<AudioGeneratorArgs> = {},
): Promise<GeneratedRommzProductLaunchHybridAudio> => {
  const resolvedArgs: AudioGeneratorArgs = {
    ...DEFAULT_ARGS,
    ...args,
  };
  const warnings: string[] = [];

  await mkdir(PUBLIC_AUDIO_DIR, {recursive: true});
  await mkdir(TMP_AUDIO_DIR, {recursive: true});

  const scriptPath = resolve(PUBLIC_AUDIO_DIR, SCRIPT_FILE_NAME);
  const manifestPath = resolve(PUBLIC_AUDIO_DIR, MANIFEST_FILE_NAME);
  const ssmlPath = resolve(TMP_AUDIO_DIR, "rommz-product-launch-hybrid-preview-voiceover.ssml");

  await rm(rommzProductLaunchHybridPreviewVietnameseVoiceoverPath, {force: true});
  await rm(rommzProductLaunchHybridPreviewFallbackVoiceoverPath, {force: true});
  await rm(rommzProductLaunchHybridPreviewSoundtrackPath, {force: true});

  const scriptText = buildVoiceoverScript();
  await writeFile(scriptPath, `${scriptText}\n`, "utf8");
  await writeFile(
    ssmlPath,
    buildVoiceoverSsml(resolvedArgs.voiceName ?? "Microsoft Zira Desktop"),
    "utf8",
  );

  await createAmbientBed(rommzProductLaunchHybridPreviewSoundtrackPath);

  const preferredVoiceName = resolvedArgs.voiceName ?? DEFAULT_EDGE_TTS_VOICE;
  let voiceoverResult = await generateVoiceoverWithEdgeTts({
    outputPath: rommzProductLaunchHybridPreviewVietnameseVoiceoverPath,
    rate: resolvedArgs.rate,
    scriptPath,
    voiceName: preferredVoiceName,
  });

  if (!voiceoverResult.ok) {
    warnings.push(voiceoverResult.warning);

    voiceoverResult = await generateVoiceoverWithPowerShell({
      outputPath: rommzProductLaunchHybridPreviewFallbackVoiceoverPath,
      rate: resolvedArgs.rate,
      ssmlPath,
      voiceName: "Microsoft Zira Desktop",
    });
  }

  if (!voiceoverResult.ok) {
    warnings.push(voiceoverResult.warning);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    mode: "preview",
    rate: resolvedArgs.rate,
    soundtrack: {
      src: rommzProductLaunchHybridPreviewSoundtrackSrc,
      outputPath: rommzProductLaunchHybridPreviewSoundtrackPath,
    },
    voiceover: voiceoverResult.ok
      ? {
          provider: voiceoverResult.provider,
          src: voiceoverResult.voiceoverSrc,
          outputPath: voiceoverResult.voiceoverPath,
          voiceName: voiceoverResult.voiceName,
        }
      : null,
    warnings,
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    manifestPath,
    provider: voiceoverResult.ok ? voiceoverResult.provider : undefined,
    scriptPath,
    soundtrackSrc: rommzProductLaunchHybridPreviewSoundtrackSrc,
    voiceName: voiceoverResult.ok ? voiceoverResult.voiceName : undefined,
    voiceoverSrc: voiceoverResult.ok ? voiceoverResult.voiceoverSrc : undefined,
    warnings,
  };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const result = await ensureGeneratedRommzProductLaunchHybridAudio(args);

  console.log(`[remotion-product-launch-audio] script: ${result.scriptPath}`);
  console.log(`[remotion-product-launch-audio] manifest: ${result.manifestPath}`);
  console.log(
    `[remotion-product-launch-audio] soundtrack: ${rommzProductLaunchHybridPreviewSoundtrackPath}`,
  );

  if (result.voiceoverSrc) {
    console.log(
      `[remotion-product-launch-audio] voiceover: ${
        result.provider === "edge-tts"
          ? rommzProductLaunchHybridPreviewVietnameseVoiceoverPath
          : rommzProductLaunchHybridPreviewFallbackVoiceoverPath
      }`,
    );
  }

  for (const warning of result.warnings) {
    console.warn(`[remotion-product-launch-audio] warning: ${warning}`);
  }
};

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
