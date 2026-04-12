import { describe, expect, test } from "vitest";

import {buildRommzProductLaunchHybridPayload} from "./buildRommzProductLaunchHybridPayload";

describe("buildRommzProductLaunchHybridPayload", () => {
  test("falls back to the fixture contract when no snapshot is provided", () => {
    const payload = buildRommzProductLaunchHybridPayload();

    expect(payload.brandName).toBe("RommZ");
    expect(payload.scenes).toHaveLength(7);
    expect(payload.captures["landing-hero"]).toContain("data:image/svg+xml");
    expect(payload.audio.voiceover.src).toBeUndefined();
  });

  test("maps capture payload and audio overrides into the Remotion contract", () => {
    const payload = buildRommzProductLaunchHybridPayload({
      dataSource: "captures",
      capturedAt: "2026-03-30T10:00:00.000Z",
      captures: {
        "landing-hero": "data:image/png;base64,landing",
        "search-results": "data:image/png;base64,search",
        "romi-chat": "data:image/png;base64,romi",
        "services-deals": "data:image/png;base64,services",
        "payment-pricing": "data:image/png;base64,payment",
      },
      audio: {
        voiceoverSrc: "/audio/voiceover.mp3",
        soundtrackSrc: "/audio/bed.mp3",
      },
    });

    expect(payload.supportLabel).toContain("Playwright captures");
    expect(payload.captures["search-results"]).toBe("data:image/png;base64,search");
    expect(payload.audio.voiceover.src).toBe("/audio/voiceover.mp3");
    expect(payload.audio.soundtrack?.src).toBe("/audio/bed.mp3");
    expect(payload.scenes[5].durationInFrames).toBe(180);
  });
});
