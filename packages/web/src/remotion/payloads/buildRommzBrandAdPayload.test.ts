import { describe, expect, test } from "vitest";

import {buildRommzBrandAdPayload} from "./buildRommzBrandAdPayload";

describe("buildRommzBrandAdPayload", () => {
  test("falls back to the fixture contract when no snapshot is provided", () => {
    const payload = buildRommzBrandAdPayload();

    expect(payload.brandName).toBe("RommZ");
    expect(payload.scenes).toHaveLength(3);
    expect(payload.audio.voiceover.src).toBeUndefined();
  });

  test("maps live snapshot values into render props", () => {
    const payload = buildRommzBrandAdPayload({
      dataSource: "database",
      capturedAt: "2026-03-30T10:00:00.000Z",
      rooms: {
        activeCount: 128,
        verifiedCount: 41,
        featured: [
          {
            id: "room-1",
            title: "Studio gan lang dai hoc",
            city: "TP.HCM",
            district: "Thu Duc",
            pricePerMonth: 5200000,
            isVerified: true,
            imageUrl: "https://cdn.example.com/hero-room.jpg",
            viewCount: 180,
            favoriteCount: 44,
          },
        ],
      },
      deals: {
        activeCount: 16,
        premiumCount: 6,
      },
      partners: {
        activeCount: 22,
        topCategory: "utilities",
      },
      community: {
        activeCount: 87,
        topPostTitle: "Kinh nghiem chot phong gan truong",
      },
      audio: {
        voiceoverSrc: "/audio/voiceover.mp3",
        soundtrackSrc: "/audio/bed.mp3",
      },
    });

    expect(payload.heroImageSrc).toBe("https://cdn.example.com/hero-room.jpg");
    expect(payload.locationLabel).toBe("Thu Duc / TP.HCM");
    expect(payload.supportLabel).toContain("Live data snapshot");
    expect(payload.stats[0].value).toContain("128");
    expect(payload.scenes[0].voiceoverText).toContain("128");
    expect(payload.audio.voiceover.src).toBe("/audio/voiceover.mp3");
    expect(payload.audio.soundtrack?.src).toBe("/audio/bed.mp3");
  });
});
