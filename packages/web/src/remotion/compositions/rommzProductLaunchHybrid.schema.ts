import {z} from "zod";

import {
  createRommzCapturePlaceholderDataUrl,
  rommzProductLaunchHybridCaptureIds,
} from "../captures/rommzProductLaunchHybridCaptures.ts";

export const rommzProductLaunchHybridSceneIdSchema = z.enum([
  "hook",
  "reveal",
  "search",
  "listings",
  "romi",
  "services",
  "cta",
]);

export const rommzProductLaunchHybridPaletteSchema = z.enum([
  "ink",
  "blue",
  "sand",
  "green",
]);

const rommzProductLaunchHybridAudioTrackSchema = z.object({
  src: z.string().min(1),
  volume: z.number().min(0).max(1).default(0.3),
  duckedVolume: z.number().min(0).max(1).default(0.1),
  loop: z.boolean().default(true),
  trimBeforeInFrames: z.number().int().min(0).default(0),
});

const rommzProductLaunchHybridVoiceoverSchema = z.object({
  src: z.string().min(1).optional(),
  volume: z.number().min(0).max(1).default(1),
  fadeInFrames: z.number().int().min(0).default(8),
});

const rommzProductLaunchHybridSceneSchema = z.object({
  id: rommzProductLaunchHybridSceneIdSchema,
  eyebrow: z.string().min(1),
  headline: z.string().min(1),
  body: z.string().min(1),
  statLabel: z.string().min(1),
  statValue: z.string().min(1),
  chipLabel: z.string().min(1),
  voiceoverText: z.string().min(1),
  durationInFrames: z.number().int().positive(),
  palette: rommzProductLaunchHybridPaletteSchema,
});

const rommzProductLaunchHybridTimingSchema = z.object({
  fps: z.number().int().positive().default(30),
  captionLeadInFrames: z.number().int().min(0).default(8),
  captionTailFrames: z.number().int().min(0).default(8),
  ctaGlowDelayFrames: z.number().int().min(0).default(18),
});

const rommzProductLaunchHybridCapturesSchema = z.object({
  "landing-hero": z.string().min(1),
  "search-results": z.string().min(1),
  "romi-chat": z.string().min(1),
  "services-deals": z.string().min(1),
  "payment-pricing": z.string().min(1),
});

const rommzProductLaunchHybridSceneTogglesSchema = z.object({
  hook: z.boolean().default(true),
  reveal: z.boolean().default(true),
  search: z.boolean().default(true),
  listings: z.boolean().default(true),
  romi: z.boolean().default(true),
  services: z.boolean().default(true),
  cta: z.boolean().default(true),
});

export const rommzProductLaunchHybridSchema = z.object({
  brandName: z.string().min(1),
  tagline: z.string().min(1),
  supportLabel: z.string().min(1),
  logoSrc: z.string().min(1),
  scenes: z.array(rommzProductLaunchHybridSceneSchema).length(7),
  captures: rommzProductLaunchHybridCapturesSchema,
  sceneToggles: rommzProductLaunchHybridSceneTogglesSchema,
  audio: z.object({
    voiceover: rommzProductLaunchHybridVoiceoverSchema,
    soundtrack: rommzProductLaunchHybridAudioTrackSchema.optional(),
  }),
  timing: rommzProductLaunchHybridTimingSchema,
});

export type RommzProductLaunchHybridSceneId = z.infer<typeof rommzProductLaunchHybridSceneIdSchema>;
export type RommzProductLaunchHybridPalette = z.infer<typeof rommzProductLaunchHybridPaletteSchema>;
export type RommzProductLaunchHybridScene = z.infer<typeof rommzProductLaunchHybridSceneSchema>;
export type RommzProductLaunchHybridProps = z.infer<typeof rommzProductLaunchHybridSchema>;

const capturePlaceholderMap = Object.fromEntries(
  rommzProductLaunchHybridCaptureIds.map((captureId) => [
    captureId,
    createRommzCapturePlaceholderDataUrl({
      accent:
        captureId === "romi-chat"
          ? "#0f766e"
          : captureId === "payment-pricing"
            ? "#b45309"
            : "#0f62fe",
      label: captureId,
      body: "Preview placeholder while local Playwright captures are not attached yet.",
    }),
  ]),
) as RommzProductLaunchHybridProps["captures"];

export const rommzProductLaunchHybridFixture: RommzProductLaunchHybridProps = {
  brandName: "RommZ",
  tagline: "Tìm phòng rõ hơn. Chốt nhanh hơn.",
  supportLabel: "Hybrid product-launch v2 / renter-first / local render",
  logoSrc: "/rommz-logo.png",
  scenes: [
    {
      id: "hook",
      eyebrow: "Scene 01 / Hook",
      headline: "Tìm phòng không nên bắt đầu bằng cảm giác rối.",
      body: "Quá nhiều tin lẻ, quá ít thứ đủ rõ để bạn biết nên xem tiếp phòng nào.",
      statLabel: "Nỗi mệt",
      statValue: "Bớt lướt, bớt đoán, bớt hỏi vòng",
      chipLabel: "Bắt đầu",
      voiceoverText:
        "Tìm phòng không nên bắt đầu bằng cảm giác rối. Quá nhiều tin lẻ, quá ít thứ đủ rõ để bạn biết nên xem tiếp phòng nào.",
      durationInFrames: 75,
      palette: "ink",
    },
    {
      id: "reveal",
      eyebrow: "Scene 02 / Reveal",
      headline: "Mở RommZ, bắt đầu ngay từ nơi bạn muốn ở.",
      body: "Điểm vào gọn hơn để bạn không mất thời gian trước khi tìm đúng khu vực.",
      statLabel: "Bắt đầu",
      statValue: "Vào nhanh để tìm nhanh",
      chipLabel: "Trang chủ",
      voiceoverText:
        "Mở RommZ, bắt đầu ngay từ nơi bạn muốn ở. Điểm vào gọn hơn để bạn không mất thời gian trước khi tìm đúng khu vực.",
      durationInFrames: 120,
      palette: "blue",
    },
    {
      id: "search",
      eyebrow: "Scene 03 / Search",
      headline: "Chọn khu vực trước. Lọc đúng thứ bạn quan tâm.",
      body: "Giá, diện tích và tiện ích nằm cùng một chỗ để bạn thấy ngay phòng nào hợp mình.",
      statLabel: "Bộ lọc",
      statValue: "Giá, diện tích, tiện ích",
      chipLabel: "Tìm kiếm",
      voiceoverText:
        "Chọn khu vực trước. Lọc đúng thứ bạn quan tâm. Giá, diện tích và tiện ích nằm cùng một chỗ để bạn thấy ngay phòng nào hợp mình.",
      durationInFrames: 180,
      palette: "blue",
    },
    {
      id: "listings",
      eyebrow: "Scene 04 / Listings",
      headline: "Xem ảnh, xem map, biết phòng nào đáng mở tiếp.",
      body: "Ảnh thật, vị trí và dấu xác minh giúp bạn đỡ phải nhắn thử từng nơi.",
      statLabel: "So sánh",
      statValue: "Nhìn rõ trước khi liên hệ",
      chipLabel: "Map + chi tiết",
      voiceoverText:
        "Xem ảnh, xem map, biết phòng nào đáng mở tiếp. Ảnh thật, vị trí và dấu xác minh giúp bạn đỡ phải nhắn thử từng nơi.",
      durationInFrames: 150,
      palette: "sand",
    },
    {
      id: "romi",
      eyebrow: "Scene 05 / Romi",
      headline: "Chưa biết chọn gì trước? ROMI giúp gom vài lựa chọn hợp hơn.",
      body: "Bạn nói khu vực và mức giá, ROMI rút gọn danh sách để bạn khỏi lướt lại từ đầu.",
      statLabel: "Gợi ý",
      statValue: "Ít loạn hơn khi cần shortlist",
      chipLabel: "ROMI",
      voiceoverText:
        "Chưa biết chọn gì trước? ROMI giúp gom vài lựa chọn hợp hơn. Bạn nói khu vực và mức giá, ROMI rút gọn danh sách để bạn khỏi lướt lại từ đầu.",
      durationInFrames: 150,
      palette: "green",
    },
    {
      id: "services",
      eyebrow: "Scene 06 / Support",
      headline: "Khi gần chốt, bạn vẫn có thêm vài bước hỗ trợ ở ngay đây.",
      body: "Ưu đãi quanh nơi ở mới và RommZ+ là phần bổ sung khi bạn cần đi tiếp.",
      statLabel: "Hỗ trợ thêm",
      statValue: "Xem tiếp khi bạn thật sự cần",
      chipLabel: "Ưu đãi + RommZ+",
      voiceoverText:
        "Khi gần chốt, bạn vẫn có thêm vài bước hỗ trợ ở ngay đây. Ưu đãi quanh nơi ở mới và RommZ+ là phần bổ sung khi bạn cần đi tiếp.",
      durationInFrames: 180,
      palette: "sand",
    },
    {
      id: "cta",
      eyebrow: "Scene 07 / CTA",
      headline: "RommZ. Tìm phòng rõ hơn, chốt nhanh hơn.",
      body: "Ít lướt hơn. Ít đoán hơn. Nhanh biết đâu là chỗ nên xem tiếp.",
      statLabel: "Kết",
      statValue: "Rõ trước khi chốt",
      chipLabel: "Renter-first",
      voiceoverText:
        "RommZ. Tìm phòng rõ hơn, chốt nhanh hơn. Ít lướt hơn, ít đoán hơn, nhanh biết đâu là chỗ nên xem tiếp.",
      durationInFrames: 135,
      palette: "blue",
    },
  ],
  captures: capturePlaceholderMap,
  sceneToggles: {
    hook: true,
    reveal: true,
    search: true,
    listings: true,
    romi: true,
    services: true,
    cta: true,
  },
  audio: {
    voiceover: {
      volume: 1,
      fadeInFrames: 10,
    },
  },
  timing: {
    fps: 30,
    captionLeadInFrames: 8,
    captionTailFrames: 8,
    ctaGlowDelayFrames: 18,
  },
};
