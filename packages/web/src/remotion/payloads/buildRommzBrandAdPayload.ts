import {
  rommzBrandAdFixture,
  rommzBrandAdSchema,
  type RommzBrandAdProps,
  type RommzBrandAdStat,
} from "../compositions/rommzBrandAd.schema.ts";

export type RommzBrandAdFeaturedRoom = {
  id: string;
  title: string;
  city: string | null;
  district: string | null;
  pricePerMonth: number;
  isVerified: boolean;
  imageUrl?: string | null;
  viewCount?: number | null;
  favoriteCount?: number | null;
};

export type RommzBrandAdSnapshot = {
  dataSource: "database" | "fixture";
  capturedAt: string;
  warnings?: string[];
  rooms?: {
    activeCount?: number | null;
    verifiedCount?: number | null;
    featured?: RommzBrandAdFeaturedRoom[];
  };
  deals?: {
    activeCount?: number | null;
    premiumCount?: number | null;
  };
  partners?: {
    activeCount?: number | null;
    topCategory?: string | null;
  };
  community?: {
    activeCount?: number | null;
    topPostTitle?: string | null;
  };
  audio?: {
    voiceoverSrc?: string;
    soundtrackSrc?: string;
  };
};

const formatCount = (value: number | null | undefined, fallback: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return new Intl.NumberFormat("vi-VN").format(value);
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

const TRUSTED_MARKET_TOKENS = [
  "ho chi minh",
  "tp.hcm",
  "tphcm",
  "thu duc",
  "di an",
  "binh duong",
  "ha noi",
  "da nang",
  "can tho",
];

const normalizeToken = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const isTrustedMarketRoom = (room: RommzBrandAdFeaturedRoom) => {
  const marketSignal = [room.district, room.city].filter(Boolean).join(" ");
  const normalizedMarketSignal = normalizeToken(marketSignal);

  return TRUSTED_MARKET_TOKENS.some((token) => normalizedMarketSignal.includes(token));
};

const collectAreaTokens = (featuredRooms: RommzBrandAdFeaturedRoom[]) => {
  const tokens = featuredRooms.flatMap((room) => [room.district, room.city]).filter(Boolean) as string[];

  return Array.from(new Set(tokens)).slice(0, 2);
};

const resolveLocationLabel = (featuredRooms: RommzBrandAdFeaturedRoom[]) => {
  const tokens = collectAreaTokens(featuredRooms);

  return tokens.length > 0 ? tokens.join(" / ") : rommzBrandAdFixture.locationLabel;
};

const resolveHeroImage = (featuredRooms: RommzBrandAdFeaturedRoom[]) => {
  return featuredRooms.find((room) => room.imageUrl)?.imageUrl ?? rommzBrandAdFixture.heroImageSrc;
};

const buildStats = (snapshot: RommzBrandAdSnapshot): RommzBrandAdStat[] => {
  const activeRooms = formatCount(snapshot.rooms?.activeCount, "nhiều");
  const verifiedRooms = formatCount(snapshot.rooms?.verifiedCount, "nhiều");
  const activeDeals = formatCount(snapshot.deals?.activeCount, "nhiều");
  const activePartners = formatCount(snapshot.partners?.activeCount, "nhiều");
  const communityPosts = formatCount(snapshot.community?.activeCount, "nhiều");

  return [
    {
      label: "Nguồn cung",
      value: `${activeRooms} listing đang live cho hành trình tìm phòng`,
    },
    {
      label: "Tin cậy",
      value: `${verifiedRooms} phòng verified cùng ${activeDeals} ưu đãi đang hoạt động`,
    },
    {
      label: "Nhịp sống",
      value: `${activePartners} đối tác và ${communityPosts} tín hiệu cộng đồng đang nối tiếp trải nghiệm`,
    },
  ];
};

const buildSupportLabel = (snapshot: RommzBrandAdSnapshot) => {
  const sourceLabel = snapshot.dataSource === "database" ? "Live data snapshot" : "Fixture snapshot";

  return `${sourceLabel} / ${formatShortDate(snapshot.capturedAt)}`;
};

const applyAudioOverrides = (payload: RommzBrandAdProps, snapshot: RommzBrandAdSnapshot) => {
  if (snapshot.audio?.voiceoverSrc) {
    payload.audio.voiceover.src = snapshot.audio.voiceoverSrc;
  }

  if (snapshot.audio?.soundtrackSrc) {
    payload.audio.soundtrack = {
      src: snapshot.audio.soundtrackSrc,
      volume: 0.24,
      duckedVolume: 0.1,
      loop: true,
      trimBeforeInFrames: 0,
    };
  }
};

export const buildRommzBrandAdPayload = (snapshot?: RommzBrandAdSnapshot): RommzBrandAdProps => {
  if (!snapshot) {
    return rommzBrandAdSchema.parse(rommzBrandAdFixture);
  }

  const payload = structuredClone(rommzBrandAdFixture);
  const featuredRooms = snapshot.rooms?.featured ?? [];
  const trustedFeaturedRooms = featuredRooms.filter(isTrustedMarketRoom);
  const hasTrustedFeaturedRooms = trustedFeaturedRooms.length > 0;
  const featuredRoomsForCreative = hasTrustedFeaturedRooms ? trustedFeaturedRooms : [];
  const topRoom = featuredRoomsForCreative[0] ?? null;
  const activeRooms = formatCount(snapshot.rooms?.activeCount, "nhiều");
  const verifiedRooms = formatCount(snapshot.rooms?.verifiedCount, "nhiều");
  const activeDeals = formatCount(snapshot.deals?.activeCount, "nhiều");
  const premiumDeals = formatCount(snapshot.deals?.premiumCount, "nhiều");
  const activePartners = formatCount(snapshot.partners?.activeCount, "nhiều");
  const communityPosts = formatCount(snapshot.community?.activeCount, "nhiều");
  const topCategory = snapshot.partners?.topCategory ?? "dịch vụ sống";
  const locationLabel = hasTrustedFeaturedRooms
    ? resolveLocationLabel(featuredRoomsForCreative)
    : rommzBrandAdFixture.locationLabel;
  const areaFocus = hasTrustedFeaturedRooms
    ? collectAreaTokens(featuredRoomsForCreative).join(", ")
    : "các cụm thuê phòng trọng điểm";
  const topRoomTitle = topRoom?.title ?? "các listing nổi bật";
  const discoverScope = hasTrustedFeaturedRooms ? `quanh ${areaFocus}` : "trên hệ thống";

  payload.supportLabel = buildSupportLabel(snapshot);
  payload.locationLabel = locationLabel;
  payload.heroImageSrc = hasTrustedFeaturedRooms
    ? resolveHeroImage(featuredRoomsForCreative)
    : rommzBrandAdFixture.heroImageSrc;
  payload.stats = buildStats(snapshot);

  payload.scenes[0].headline = `RommZ mở đầu hành trình thuê phòng bằng ${activeRooms} listing đang live ${discoverScope}.`;
  payload.scenes[0].body =
    `Nguồn cung từ ${topRoomTitle} tới các điểm nóng thuê phòng được gom lại trên một flow rõ ràng, ` +
    "để người dùng bớt lạc tab và vào shortlist nhanh hơn.";
  payload.scenes[0].voiceoverText =
    `RommZ mở đầu hành trình thuê phòng bằng ${activeRooms} listing đang live ${discoverScope}. ` +
    "Nguồn cung được gom về một flow rõ ràng để người dùng tìm nhanh và chốt gọn hơn.";
  payload.scenes[0].stat = {
    label: "Nguồn cung",
    value: hasTrustedFeaturedRooms
      ? `${activeRooms} listing active với tâm điểm ở ${locationLabel}`
      : `${activeRooms} listing active trong local snapshot hiện tại`,
  };

  payload.scenes[1].headline = `Niềm tin đến từ ${verifiedRooms} phòng verified và ${activeDeals} ưu đãi đang hoạt động cùng lúc.`;
  payload.scenes[1].body =
    `Listing, lớp ưu đãi và tín hiệu sản phẩm được đặt cạnh nhau để người thuê thấy rõ giá trị trước khi liên hệ, ` +
    "không cần đi qua quá nhiều bước rời rạc.";
  payload.scenes[1].voiceoverText =
    `Niềm tin đến từ ${verifiedRooms} phòng verified và ${activeDeals} ưu đãi đang hoạt động cùng lúc. ` +
    `RommZ giữ listing, ưu đãi và RommZ+ trong cùng một nhịp để quyết định thuê phòng bớt mệt hơn.`;
  payload.scenes[1].stat = {
    label: "Tín hiệu",
    value: `${verifiedRooms} phòng verified, ${premiumDeals} ưu đãi premium và ${activeDeals} deal đang live`,
  };

  payload.scenes[2].headline = `Sau cú chốt phòng là ${activePartners} đối tác và ${communityPosts} tín hiệu cộng đồng để trải nghiệm không đứt mạch.`;
  payload.scenes[2].body =
    `Từ ${topCategory} tới cộng đồng chia sẻ kinh nghiệm, RommZ nối tiếp hành trình sau thuê phòng ` +
    "thành một bề mặt sống động hơn thay vì chỉ dừng ở listing.";
  payload.scenes[2].voiceoverText =
    `Sau cú chốt phòng là ${activePartners} đối tác và ${communityPosts} tín hiệu cộng đồng để trải nghiệm không đứt mạch. ` +
    "RommZ nối tiếp hành trình sau thuê phòng bằng deal, cộng đồng và các utility thiết thực.";
  payload.scenes[2].stat = {
    label: "Nhịp sống",
    value: `${activePartners} đối tác quanh ${topCategory} và ${communityPosts} tín hiệu cộng đồng`,
  };

  payload.outro.body =
    `Payload local này đang bám snapshot thật từ database với ${activeRooms} listing, ${activeDeals} deal và ${activePartners} đối tác. ` +
    "Khi phase sau nối voiceover asset hoặc renderer job, cùng contract này có thể render lại mà không đổi composition.";
  payload.outro.voiceoverText =
    `RommZ đang bám snapshot thật từ database với ${activeRooms} listing, ${activeDeals} deal và ${activePartners} đối tác. ` +
    "Khung video này đã sẵn sàng để render lại mỗi khi payload thay đổi.";

  applyAudioOverrides(payload, snapshot);

  return rommzBrandAdSchema.parse(payload);
};
