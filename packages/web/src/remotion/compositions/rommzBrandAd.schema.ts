import {z} from "zod";

const rommzBrandAdPaletteSchema = z.enum(["primary", "secondary", "tertiary"]);

const rommzBrandAdStatSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const rommzBrandAdSceneSchema = z.object({
  id: z.string().min(1),
  eyebrow: z.string().min(1),
  headline: z.string().min(1),
  body: z.string().min(1),
  accentWord: z.string().min(1),
  visualLabel: z.string().min(1),
  voiceoverText: z.string().min(1),
  stat: rommzBrandAdStatSchema,
  palette: rommzBrandAdPaletteSchema,
  minDurationInFrames: z.number().int().positive().default(84),
});

const rommzBrandAdOutroSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  ctaLabel: z.string().min(1),
  voiceoverText: z.string().min(1),
  minDurationInFrames: z.number().int().positive().default(78),
});

const rommzBrandAdAudioTrackSchema = z.object({
  src: z.string().min(1),
  volume: z.number().min(0).max(1).default(0.3),
  duckedVolume: z.number().min(0).max(1).default(0.12),
  loop: z.boolean().default(true),
  trimBeforeInFrames: z.number().int().min(0).default(0),
});

const rommzBrandAdVoiceoverSchema = z.object({
  src: z.string().min(1).optional(),
  volume: z.number().min(0).max(1).default(1),
  fadeInFrames: z.number().int().min(0).default(8),
});

const rommzBrandAdAudioSchema = z.object({
  voiceover: rommzBrandAdVoiceoverSchema,
  soundtrack: rommzBrandAdAudioTrackSchema.optional(),
});

const rommzBrandAdTimingSchema = z.object({
  fps: z.number().int().positive().default(30),
  introFrames: z.number().int().min(0).default(24),
  baseSceneFrames: z.number().int().positive().default(84),
  framesPerWord: z.number().int().positive().default(8),
  sceneTailFrames: z.number().int().min(0).default(16),
  overlapFrames: z.number().int().min(0).default(10),
  outroFrames: z.number().int().positive().default(78),
  ctaHoldFrames: z.number().int().positive().default(20),
});

export const rommzBrandAdSchema = z.object({
  brandName: z.string().min(1),
  tagline: z.string().min(1),
  supportLabel: z.string().min(1),
  locationLabel: z.string().min(1),
  logoSrc: z.string().min(1),
  heroImageSrc: z.string().min(1),
  stats: z.array(rommzBrandAdStatSchema).min(3).max(3),
  scenes: z.array(rommzBrandAdSceneSchema).min(3).max(3),
  outro: rommzBrandAdOutroSchema,
  audio: rommzBrandAdAudioSchema,
  timing: rommzBrandAdTimingSchema,
});

export type RommzBrandAdPalette = z.infer<typeof rommzBrandAdPaletteSchema>;
export type RommzBrandAdStat = z.infer<typeof rommzBrandAdStatSchema>;
export type RommzBrandAdScene = z.infer<typeof rommzBrandAdSceneSchema>;
export type RommzBrandAdProps = z.infer<typeof rommzBrandAdSchema>;

export const rommzBrandAdFixture: RommzBrandAdProps = {
  brandName: "RommZ",
  tagline: "Phòng đúng vibe. Tìm nhanh. Chốt gọn.",
  supportLabel: "Living Atlas / student-first rental flow",
  locationLabel: "TP.HCM / Thủ Đức / Dĩ An",
  logoSrc: "/rommz-logo.png",
  heroImageSrc: "/641203299_122109265521232326_7445631062855298537_n.jpg",
  stats: [
    {
      label: "Hành trình",
      value: "1 nền tảng cho tìm phòng, deal và cộng đồng",
    },
    {
      label: "Tốc độ",
      value: "Từ nhu cầu tới shortlist trong vài phút",
    },
    {
      label: "Trải nghiệm",
      value: "UI gọn, rõ và bớt ma sát khi chốt phòng",
    },
  ],
  scenes: [
    {
      id: "discover",
      eyebrow: "Brand film / Scene 01",
      headline: "RommZ mở đầu hành trình thuê phòng bằng nhịp tìm kiếm nhanh hơn.",
      body:
        "Từ nhu cầu ngân sách, khu vực tới phong cách sống, mọi tín hiệu được gom lại thành một bề mặt rõ ràng thay vì nhiều tab rời rạc.",
      accentWord: "DISCOVER",
      visualLabel: "Search, shortlist, map context",
      voiceoverText:
        "RommZ mở đầu hành trình thuê phòng bằng nhịp tìm kiếm nhanh hơn. Nhu cầu được gom về một flow rõ ràng, bớt vòng lặp và bớt lạc hướng.",
      stat: {
        label: "Đầu vào",
        value: "Ngân sách, khu vực, vibe sống được chuẩn hóa thành một flow",
      },
      palette: "primary",
      minDurationInFrames: 88,
    },
    {
      id: "trust",
      eyebrow: "Brand film / Scene 02",
      headline: "Thông tin bớt nhiễu để quyết định thuê phòng bớt mệt.",
      body:
        "Chi tiết listing, dịch vụ và lợi ích thành viên được đặt cạnh nhau để người thuê nhìn thấy giá trị thực trước khi liên hệ hoặc đặt lịch.",
      accentWord: "TRUST",
      visualLabel: "Listing quality, service layer, premium value",
      voiceoverText:
        "Thông tin bớt nhiễu để quyết định thuê phòng bớt mệt. Listing, dịch vụ và RommZ+ đứng cùng một nhịp để người dùng thấy giá trị thực trước khi hành động.",
      stat: {
        label: "Tín hiệu",
        value: "Listing, dịch vụ và ưu đãi được trình bày cùng ngữ cảnh",
      },
      palette: "secondary",
      minDurationInFrames: 92,
    },
    {
      id: "lifestyle",
      eyebrow: "Brand film / Scene 03",
      headline: "RommZ không chỉ là chỗ tìm phòng, mà là bệ phóng cho nhịp sống mới.",
      body:
        "Sau cú chốt phòng là những lớp hỗ trợ tiếp theo: deal, cộng đồng, nhắn tin và các utility để việc chuyển chỗ ở không đứt mạch.",
      accentWord: "MOVE",
      visualLabel: "Deals, community, after-rent utilities",
      voiceoverText:
        "RommZ không chỉ là chỗ tìm phòng, mà là bệ phóng cho nhịp sống mới. Sau cú chốt phòng vẫn còn deal, cộng đồng và utility để trải nghiệm không đứt mạch.",
      stat: {
        label: "Mở rộng",
        value: "Từ tìm phòng sang sống, kết nối và tối ưu chi phí",
      },
      palette: "tertiary",
      minDurationInFrames: 94,
    },
  ],
  outro: {
    headline: "RommZ. Thuê phòng theo cách gọn hơn, sáng hơn và đáng nhớ hơn.",
    body:
      "Brand ad scaffold này đã sẵn sàng để nối dữ liệu thật từ API hoặc server action qua một payload serializable trước khi render local.",
    ctaLabel: "Render local / feed từ payload",
    voiceoverText:
      "RommZ. Thuê phòng theo cách gọn hơn, sáng hơn và đáng nhớ hơn. Khung video đã sẵn sàng để nhận payload thật và render local.",
    minDurationInFrames: 82,
  },
  audio: {
    voiceover: {
      volume: 1,
      fadeInFrames: 10,
    },
  },
  timing: {
    fps: 30,
    introFrames: 24,
    baseSceneFrames: 84,
    framesPerWord: 8,
    sceneTailFrames: 16,
    overlapFrames: 10,
    outroFrames: 78,
    ctaHoldFrames: 20,
  },
};
