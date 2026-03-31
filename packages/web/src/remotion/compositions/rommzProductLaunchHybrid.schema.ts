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
  tagline: "Tìm phòng nhanh hơn. Rõ hơn. Gọn hơn.",
  supportLabel: "Hybrid product-launch / renter-first / local render",
  logoSrc: "/rommz-logo.png",
  scenes: [
    {
      id: "hook",
      eyebrow: "Scene 01 / Hook",
      headline: "Tìm phòng không nên là một mớ tab.",
      body: "Giá thiếu rõ ràng, vị trí mơ hồ và ảnh không đủ tin là thứ RommZ muốn cắt bỏ đầu tiên.",
      statLabel: "Pain point",
      statValue: "Bớt nhiễu trước khi phải quyết định",
      chipLabel: "Rental chaos",
      voiceoverText:
        "Tìm phòng không nên là một mớ tab. Giá thiếu rõ ràng, vị trí mơ hồ và ảnh không đủ tin là thứ RommZ muốn cắt bỏ đầu tiên.",
      durationInFrames: 75,
      palette: "ink",
    },
    {
      id: "reveal",
      eyebrow: "Scene 02 / Reveal",
      headline: "RommZ gom mọi tín hiệu về một bề mặt gọn.",
      body: "Từ trang chủ tới ô tìm kiếm, mọi đường vào đều được rút ngắn để người thuê bắt đầu nhanh hơn.",
      statLabel: "Reveal",
      statValue: "Một nhịp vào phòng nhanh hơn",
      chipLabel: "Trang chủ",
      voiceoverText:
        "RommZ gom mọi tín hiệu về một bề mặt gọn. Từ trang chủ tới ô tìm kiếm, mọi đường vào đều được rút ngắn để người thuê bắt đầu nhanh hơn.",
      durationInFrames: 120,
      palette: "blue",
    },
    {
      id: "search",
      eyebrow: "Scene 03 / Search",
      headline: "Tìm theo khu vực, lọc đúng nhu cầu.",
      body: "Giá, diện tích, tiện ích và bán kính quanh điểm bạn cần được đưa vào cùng một flow rõ ràng.",
      statLabel: "Search flow",
      statValue: "Khu vực, giá, tiện ích, khoảng cách",
      chipLabel: "Search + filters",
      voiceoverText:
        "Tìm theo khu vực, lọc đúng nhu cầu. Giá, diện tích, tiện ích và bán kính quanh điểm bạn cần được đưa vào cùng một flow rõ ràng.",
      durationInFrames: 180,
      palette: "blue",
    },
    {
      id: "listings",
      eyebrow: "Scene 04 / Listings",
      headline: "Listing, map và chi tiết đều đọc được trong một nhịp.",
      body: "Người thuê nhìn được ảnh, badge verified và ngữ cảnh vị trí trước khi liên hệ hay lưu shortlist.",
      statLabel: "Trust",
      statValue: "Đọc nhanh hơn trước khi chốt",
      chipLabel: "Map + verified",
      voiceoverText:
        "Listing, map và chi tiết đều đọc được trong một nhịp. Người thuê nhìn được ảnh, badge verified và ngữ cảnh vị trí trước khi liên hệ hay lưu shortlist.",
      durationInFrames: 150,
      palette: "sand",
    },
    {
      id: "romi",
      eyebrow: "Scene 05 / Romi",
      headline: "ROMI giúp gom shortlist theo đúng câu hỏi của bạn.",
      body: "Thay vì mở thêm một lớp giao diện rối, ROMI giữ cuộc trò chuyện gọn và bám thẳng vào nhu cầu tìm phòng.",
      statLabel: "Concierge",
      statValue: "Hỏi đúng trước khi gợi ý",
      chipLabel: "Romi concierge",
      voiceoverText:
        "ROMI giúp gom shortlist theo đúng câu hỏi của bạn. Thay vì mở thêm một lớp giao diện rối, ROMI giữ cuộc trò chuyện gọn và bám thẳng vào nhu cầu tìm phòng.",
      durationInFrames: 150,
      palette: "green",
    },
    {
      id: "services",
      eyebrow: "Scene 06 / Ecosystem",
      headline: "Sau khi chốt phòng, deal và RommZ+ vẫn đi cùng.",
      body: "Ưu đãi địa phương và gói premium giúp hành trình sau khi thuê phòng không bị đứt mạch.",
      statLabel: "Value layer",
      statValue: "Services, deals và premium ở cùng hệ",
      chipLabel: "Services + payment",
      voiceoverText:
        "Sau khi chốt phòng, deal và RommZ plus vẫn đi cùng. Ưu đãi địa phương và gói premium giúp hành trình sau khi thuê phòng không bị đứt mạch.",
      durationInFrames: 180,
      palette: "sand",
    },
    {
      id: "cta",
      eyebrow: "Scene 07 / CTA",
      headline: "RommZ. Tìm phòng nhanh hơn, rõ hơn và bớt mệt hơn.",
      body: "Một surface cho tìm phòng, shortlist, deal và các bước tiếp theo quanh nơi ở mới.",
      statLabel: "CTA",
      statValue: "Search smarter today",
      chipLabel: "Renter-first",
      voiceoverText:
        "RommZ. Tìm phòng nhanh hơn, rõ hơn và bớt mệt hơn. Một surface cho tìm phòng, shortlist, deal và các bước tiếp theo quanh nơi ở mới.",
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
