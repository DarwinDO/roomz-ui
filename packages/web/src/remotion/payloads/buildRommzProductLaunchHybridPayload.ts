import {
  rommzProductLaunchHybridFixture,
  rommzProductLaunchHybridSchema,
  type RommzProductLaunchHybridProps,
} from "../compositions/rommzProductLaunchHybrid.schema.ts";
import {type RommzProductLaunchHybridCaptureId} from "../captures/rommzProductLaunchHybridCaptures.ts";

export type RommzProductLaunchHybridSnapshot = {
  dataSource: "captures" | "fixture";
  capturedAt: string;
  warnings?: string[];
  captures?: Partial<Record<RommzProductLaunchHybridCaptureId, string>>;
  audio?: {
    voiceoverSrc?: string;
    soundtrackSrc?: string;
  };
};

const formatShortDate = (capturedAt: string) => {
  const parsed = new Date(capturedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "local snapshot";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const applyAudioOverrides = (
  payload: RommzProductLaunchHybridProps,
  snapshot: RommzProductLaunchHybridSnapshot,
) => {
  if (snapshot.audio?.voiceoverSrc) {
    payload.audio.voiceover.src = snapshot.audio.voiceoverSrc;
  }

  if (snapshot.audio?.soundtrackSrc) {
    payload.audio.soundtrack = {
      src: snapshot.audio.soundtrackSrc,
      volume: 0.26,
      duckedVolume: 0.11,
      loop: true,
      trimBeforeInFrames: 0,
    };
  }
};

export const buildRommzProductLaunchHybridPayload = (
  snapshot?: RommzProductLaunchHybridSnapshot,
): RommzProductLaunchHybridProps => {
  if (!snapshot) {
    return rommzProductLaunchHybridSchema.parse(rommzProductLaunchHybridFixture);
  }

  const payload = structuredClone(rommzProductLaunchHybridFixture);
  payload.supportLabel =
    snapshot.dataSource === "captures"
      ? `Playwright captures / ${formatShortDate(snapshot.capturedAt)}`
      : `Fixture preview / ${formatShortDate(snapshot.capturedAt)}`;

  if (snapshot.captures) {
    payload.captures = {
      ...payload.captures,
      ...snapshot.captures,
    };
  }

  applyAudioOverrides(payload, snapshot);

  return rommzProductLaunchHybridSchema.parse(payload);
};
