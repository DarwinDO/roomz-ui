import { lazy, Suspense, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronsUpDown,
  Home,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PROVINCES } from "@/data/vietnam-locations";
import { createPublicMotion } from "@/lib/motion";
import { stitchAssets } from "@/lib/stitchAssets";
import { useThreePilotEnabled } from "@/lib/threePilot";
import { StitchFooter } from "@/components/common/StitchFooter";
import { cn } from "@/components/ui/utils";

const LandingHeroPilot3D = lazy(() =>
  import("@/components/3d/HeroAccentPilot").then((module) => ({
    default: module.LandingHeroPilot3D,
  })),
);

const landingLocations = PROVINCES.map((province) => province.name);
const defaultLandingLocation =
  landingLocations.find((province) => province.includes("Hồ Chí Minh")) || landingLocations[0] || "";
const landingBudgetOptions = ["2-5 triệu", "5-10 triệu", "Trên 10 triệu"] as const;
const landingRoomTypes = ["Căn hộ", "Phòng trọ", "Nguyên căn"] as const;

function compactProvinceLabel(province: string) {
  const normalized = province
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  if (normalized.includes("ho chi minh")) {
    return "TP.HCM";
  }

  if (normalized.includes("ha noi")) {
    return "Hà Nội";
  }

  if (normalized.startsWith("thanh pho ")) {
    return province.split(" ").slice(2).join(" ");
  }

  if (normalized.startsWith("tinh ")) {
    return province.split(" ").slice(1).join(" ");
  }

  return province;
}

function compactBudgetLabel(value: string) {
  if (value.includes("2-5")) {
    return "2-5tr";
  }

  if (value.includes("5-10")) {
    return "5-10tr";
  }

  if (value.includes("TrÃªn")) {
    return ">10tr";
  }

  return value;
}

const serviceCards = [
  {
    title: "Tìm phòng trọ",
    description:
      "Tin đăng được xác thực, rõ giá và rõ khu vực để bạn rút ngắn thời gian lọc.",
    icon: Home,
    accent: "bg-primary/10 text-primary",
    line: "bg-primary-container",
    path: "/search",
  },
  {
    title: "Tìm bạn đồng hành",
    description:
      "Kết nối theo nhịp sống, ngân sách và khu vực ưu tiên thay vì bắt đầu từ một cuộc chat mù.",
    icon: Users,
    accent: "bg-secondary-container/20 text-secondary",
    line: "bg-secondary-container",
    path: "/roommates",
  },
  {
    title: "Ở ngắn hạn",
    description:
      "Giải pháp cho sublet, chuyển tiếp hoặc các khoảng ở tạm mà không rời hành trình tìm chỗ ở.",
    icon: CalendarDays,
    accent: "bg-tertiary-container/20 text-tertiary",
    line: "bg-tertiary-container",
    path: "/swap",
  },
  {
    title: "Dịch vụ & ưu đãi",
    description:
      "Mạng lưới đối tác chuyển phòng, dọn dẹp và voucher địa phương đi cùng nơi ở của bạn.",
    icon: Sparkles,
    accent: "bg-destructive/10 text-destructive",
    line: "bg-destructive/30",
    path: "/services",
  },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const canRenderThreePilot = useThreePilotEnabled({
    enabled: !shouldReduceMotion,
    minWidth: 1180,
  });
  const motionTokens = useMemo(
    () => createPublicMotion(!!shouldReduceMotion),
    [shouldReduceMotion],
  );
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isRoomTypeOpen, setIsRoomTypeOpen] = useState(false);
  const [location, setLocation] = useState(defaultLandingLocation);
  const [budget, setBudget] = useState<(typeof landingBudgetOptions)[number]>(landingBudgetOptions[0]);
  const [roomType, setRoomType] = useState<(typeof landingRoomTypes)[number]>(landingRoomTypes[0]);
  const compactLocation = useMemo(() => compactProvinceLabel(location), [location]);
  const compactBudget = useMemo(() => compactBudgetLabel(budget), [budget]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location.trim()) {
      params.set("q", location.trim());
    }
    params.set("budget", budget);
    params.set("roomType", roomType);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="bg-background text-foreground">
      <main
        className="pt-24"
        aria-label="Noi dung chinh trang chu, skip link duoc cung cap boi AppShell"
      >
        <motion.section
          className="mx-auto max-w-7xl overflow-hidden px-6 pb-24 pt-12 md:px-8"
          initial="hidden"
          whileInView="show"
          viewport={motionTokens.viewport}
          variants={motionTokens.stagger(0.1, 0.06)}
        >
          <div className="grid items-center gap-12 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:gap-16">
            <motion.div className="z-10" variants={motionTokens.reveal(24)}>
              <span className="mb-6 inline-block rounded-full bg-secondary-container px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-secondary-container-foreground">
                Premium co-living
              </span>
              <h1 className="mb-8 max-w-[14ch] xl:max-w-[12ch]">
                Tìm chốn <span className="text-primary">dừng chân</span>, gặp bạn đồng hành
              </h1>
              <p className="mb-12 max-w-[34rem] text-lg leading-relaxed text-muted-foreground md:text-xl">
                Nền tảng kết nối không gian sống hiện đại dành riêng cho sinh viên và
                người thuê trẻ. Khám phá ngôi nhà phù hợp cùng những người bạn ở ghép
                đúng gu.
              </p>

              <motion.div
                className="stitch-editorial-shadow flex flex-col gap-4 rounded-[32px] bg-white p-4 lg:flex-row lg:items-center"
                variants={motionTokens.revealScale(24)}
              >
                <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(176px,1.58fr)_minmax(124px,0.78fr)_minmax(152px,0.88fr)] lg:gap-0">
                  <div className="min-w-0 px-4 lg:min-w-[176px] xl:border-r xl:border-surface-container">
                    <span className="block whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Vị trí
                    </span>
                    <div className="mt-2 min-w-0">
                      <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
                        <PopoverTrigger asChild>
                          <button
                            id="landing-location-search"
                            type="button"
                            aria-label="Chọn thành phố hoặc khu vực"
                            className="flex min-w-0 h-auto min-h-0 w-full items-center gap-2 rounded-none border-none bg-transparent px-0 py-0 text-left text-sm font-semibold text-foreground shadow-none outline-none"
                          >
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1 truncate">{compactLocation}</span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-[320px] rounded-[24px] border-surface-container p-0"
                        >
                          <Command className="rounded-[24px]">
                            <CommandInput placeholder="Tìm tỉnh, thành phố..." />
                            <CommandList className="max-h-72">
                              <CommandEmpty>Không tìm thấy khu vực phù hợp.</CommandEmpty>
                              <CommandGroup heading="Tỉnh, thành phố">
                                {landingLocations.map((option) => (
                                  <CommandItem
                                    key={option}
                                    value={`${option} ${compactProvinceLabel(option)}`}
                                    onSelect={() => {
                                      setLocation(option);
                                      setIsLocationOpen(false);
                                    }}
                                    className="flex items-center gap-3 rounded-xl px-3 py-3"
                                  >
                                    <Check
                                      className={cn(
                                        "h-4 w-4 text-primary transition-opacity",
                                        location === option ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <div className="min-w-0">
                                      <div className="font-medium text-foreground">
                                        {compactProvinceLabel(option)}
                                      </div>
                                      <div className="truncate text-xs text-muted-foreground">
                                        {option}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="min-w-0 px-4 xl:border-r xl:border-surface-container">
                    <span className="block whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Ngân sách
                    </span>
                    <div className="mt-2 flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-primary">₫</span>
                      <Popover open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
                        <PopoverTrigger asChild>
                          <button
                            id="landing-budget-search"
                            type="button"
                            aria-label="Chon ngan sach"
                            className="flex h-auto min-h-0 w-full min-w-0 items-center gap-2 rounded-none border-none bg-transparent px-0 py-0 text-left text-sm font-semibold leading-tight text-foreground shadow-none outline-none"
                          >
                            <span className="min-w-0 flex-1 truncate">{compactBudget}</span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-[240px] rounded-[24px] border-surface-container p-2"
                        >
                          <div className="space-y-1">
                            {landingBudgetOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setBudget(option);
                                  setIsBudgetOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left text-sm transition-colors",
                                  budget === option
                                    ? "bg-primary-container/30 text-foreground"
                                    : "text-foreground hover:bg-surface-container-low",
                                )}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0 text-primary transition-opacity",
                                    budget === option ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span className="truncate font-medium">{option}</span>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="min-w-0 px-4">
                    <span className="block whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Loại phòng
                    </span>
                    <div className="mt-2 flex min-w-0 items-center gap-2">
                      <Home className="h-4 w-4 shrink-0 text-primary" />
                      <Popover open={isRoomTypeOpen} onOpenChange={setIsRoomTypeOpen}>
                        <PopoverTrigger asChild>
                          <button
                            id="landing-room-type-search"
                            type="button"
                            aria-label="Chon loai phong"
                            className="flex h-auto min-h-0 w-full min-w-0 items-center gap-2 rounded-none border-none bg-transparent px-0 py-0 text-left text-sm font-semibold leading-tight text-foreground shadow-none outline-none"
                          >
                            <span className="min-w-0 flex-1 truncate">{roomType}</span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-[240px] rounded-[24px] border-surface-container p-2"
                        >
                          <div className="space-y-1">
                            {landingRoomTypes.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setRoomType(option);
                                  setIsRoomTypeOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left text-sm transition-colors",
                                  roomType === option
                                    ? "bg-primary-container/30 text-foreground"
                                    : "text-foreground hover:bg-surface-container-low",
                                )}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0 text-primary transition-opacity",
                                    roomType === option ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span className="truncate font-medium">{option}</span>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleSearch}
                  className="stitch-primary-gradient flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-[32px] px-8 font-display text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] lg:min-w-[196px] lg:w-auto"
                  whileHover={motionTokens.hoverSoft}
                  whileTap={motionTokens.tap}
                >
                  <Search className="h-4 w-4" />
                  Tìm kiếm
                </motion.button>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative mx-auto w-full max-w-2xl xl:max-w-none"
              variants={motionTokens.revealScale(28)}
            >
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary-container/20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-tertiary-container/20 blur-3xl" />

              {canRenderThreePilot ? (
                <div aria-hidden className="h-[640px]" />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                <motion.div className="space-y-4" variants={motionTokens.stagger(0.08, 0.08)}>
                  <motion.img
                    src={stitchAssets.landing.heroLeftTall}
                    alt="Phòng trọ hiện đại nhiều ánh sáng"
                    className="mt-12 h-80 w-full rounded-[32px] object-cover shadow-lg"
                    variants={motionTokens.revealScale(24)}
                  />
                  <motion.div
                    className="stitch-editorial-shadow flex items-center gap-4 rounded-[28px] border border-surface-container bg-white p-6"
                    variants={motionTokens.reveal(18)}
                  >
                    <div className="flex -space-x-3 overflow-hidden">
                      {stitchAssets.landing.friendAvatars.map((avatar) => (
                        <img
                          key={avatar}
                          src={avatar}
                          alt="Thành viên RommZ"
                          className="h-10 w-10 rounded-full ring-2 ring-white"
                        />
                      ))}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-primary-container-foreground ring-2 ring-white">
                        +12
                      </div>
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-foreground">12+ bạn mới</p>
                      <p className="text-muted-foreground">Đang tìm phòng tại Quận 1</p>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div className="space-y-4" variants={motionTokens.stagger(0.08, 0.12)}>
                  <motion.img
                    src={stitchAssets.landing.heroRightTall}
                    alt="Không gian sống chung sáng sủa"
                    className="h-96 w-full rounded-[32px] object-cover shadow-lg"
                    variants={motionTokens.revealScale(28)}
                  />
                  <motion.img
                    src={stitchAssets.landing.heroRightBottom}
                    alt="Ngoại thất khu nhà hiện đại"
                    className="h-48 w-full rounded-[32px] object-cover shadow-lg"
                    variants={motionTokens.revealScale(18)}
                  />
                </motion.div>
                </div>
              )}

              {canRenderThreePilot ? (
                <div className="absolute inset-0">
                  <Suspense fallback={null}>
                    <LandingHeroPilot3D friendAvatars={stitchAssets.landing.friendAvatars} />
                  </Suspense>
                </div>
              ) : null}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="bg-surface-container-low py-24"
          initial="hidden"
          whileInView="show"
          viewport={motionTokens.viewport}
          variants={motionTokens.stagger(0.08, 0.05)}
        >
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <motion.div
              className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
              variants={motionTokens.reveal(22)}
            >
              <div className="max-w-xl">
                <h2 className="mb-6">Dịch vụ tại RommZ</h2>
                <p className="text-lg text-muted-foreground">
                  Mọi điểm chạm quan trọng của hành trình tìm nơi ở đều được gom lại thành
                  những lối vào rõ ràng.
                </p>
              </div>
              <motion.button
                type="button"
                onClick={() => navigate("/services")}
                className="group flex items-center gap-2 font-display text-sm font-bold text-primary transition-all hover:gap-4"
                whileTap={motionTokens.tap}
              >
                Xem tất cả dịch vụ
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>

            <motion.div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
              variants={motionTokens.stagger(0.08, 0.08)}
            >
              {serviceCards.map((card) => {
                const Icon = card.icon;

                return (
                  <motion.button
                    key={card.title}
                    type="button"
                    onClick={() => navigate(card.path)}
                    className="group rounded-[28px] bg-white p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
                    variants={motionTokens.revealScale(20)}
                    whileTap={motionTokens.tap}
                  >
                    <div
                      className={`mb-8 flex h-16 w-16 items-center justify-center rounded-[22px] ${card.accent} transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mb-4 text-xl">{card.title}</h3>
                    <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                    <div className={`h-1 w-10 rounded-full ${card.line}`} />
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="mx-auto max-w-7xl px-6 py-24 md:px-8"
          initial="hidden"
          whileInView="show"
          viewport={motionTokens.viewport}
          variants={motionTokens.stagger(0.08, 0.05)}
        >
          <motion.div className="mb-20 text-center" variants={motionTokens.reveal(22)}>
            <h2 className="mb-4">Cộng đồng RommZ</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Nơi những câu chuyện về chia sẻ, chuyển phòng và kết nối bắt đầu.
            </p>
          </motion.div>

          <motion.div
            className="grid h-[800px] grid-cols-1 gap-6 md:h-[600px] md:grid-cols-4 md:grid-rows-2"
            variants={motionTokens.stagger(0.08, 0.08)}
          >
            <motion.button
              type="button"
              onClick={() => navigate("/community")}
              className="group relative overflow-hidden rounded-[32px] md:col-span-2 md:row-span-2"
              variants={motionTokens.revealScale(24)}
              whileTap={motionTokens.tap}
            >
              <img
                src={stitchAssets.landing.communityHero}
                alt="Câu chuyện cộng đồng nổi bật"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 text-left">
                <span className="mb-4 w-fit rounded-full bg-tertiary-container px-3 py-1 text-xs font-bold text-tertiary-container-foreground">
                  Câu chuyện nổi bật
                </span>
                <h3 className="mb-4 text-2xl text-white">
                  “Chúng mình đã tìm thấy nhau như thế nào?”
                </h3>
                <p className="mb-6 max-w-md text-sm text-white/80">
                  Hành trình từ người lạ thành tri kỷ của những người trẻ lần đầu ra ở riêng.
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={stitchAssets.landing.communityAuthor}
                    alt="Tác giả cộng đồng"
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                  <span className="text-xs font-medium text-white">Bởi Minh Anh • 2 ngày trước</span>
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigate("/community")}
              className="rounded-[32px] border border-transparent bg-surface-container p-8 text-left transition-all hover:border-primary/20 md:col-span-2"
              variants={motionTokens.reveal(18)}
              whileTap={motionTokens.tap}
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-2 font-display text-sm font-bold text-primary">
                  <Users className="h-4 w-4" />
                  Thảo luận mới
                </div>
                <span className="text-xs text-muted-foreground">Phòng trọ Quận 7</span>
              </div>
              <h4 className="mb-4 text-xl">
                Kinh nghiệm thuê phòng mini tránh bị “hố” giá?
              </h4>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                Người dùng RommZ đang chia sẻ các lưu ý thực tế khi thuê trọ gần trường,
                gần ga và trong các khu nhiều sinh viên.
              </p>
              <div className="mt-6 flex items-center gap-4 border-t border-outline-variant/20 pt-6">
                <div className="flex -space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-surface-container">
                    H
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white ring-2 ring-surface-container">
                    K
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  42 phản hồi • 156 lượt xem
                </span>
              </div>
            </motion.button>

            <motion.div
              className="flex flex-col items-center justify-center rounded-[32px] bg-primary-container p-8 text-center"
              variants={motionTokens.revealScale(16)}
            >
              <span className="font-display text-4xl font-black text-primary-container-foreground">
                50k+
              </span>
              <span className="mt-2 text-sm font-bold uppercase tracking-[0.22em] text-primary-container-foreground/80">
                Thành viên
              </span>
            </motion.div>

            <motion.button
              type="button"
              onClick={() => navigate("/community")}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-[32px] bg-secondary-container p-8 text-center"
              variants={motionTokens.revealScale(16)}
              whileTap={motionTokens.tap}
            >
              <Sparkles className="mb-4 h-10 w-10 text-secondary-container-foreground transition-transform group-hover:rotate-12" />
              <span className="text-sm font-bold uppercase tracking-[0.22em] text-secondary-container-foreground">
                Tham gia ngay
              </span>
            </motion.button>
          </motion.div>
        </motion.section>

        <motion.section
          className="relative z-20 mx-auto mb-[-80px] max-w-7xl px-6 md:px-8"
          initial="hidden"
          whileInView="show"
          viewport={motionTokens.viewport}
          variants={motionTokens.revealScale(22)}
        >
          <div className="stitch-primary-gradient relative overflow-hidden rounded-[32px] p-12 md:p-16">
            <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-12 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="mb-6 text-white">Bắt đầu hành trình tìm kiếm của bạn?</h2>
                <p className="text-lg text-white/80">
                  Đăng ký để nhận thông báo sớm nhất về các phòng trọ mới và gợi ý
                  bạn ở ghép phù hợp với khu vực bạn quan tâm.
                </p>
              </div>

              <div className="w-full md:w-auto">
                <div className="flex w-full flex-col gap-2 rounded-[28px] bg-white/10 p-2 backdrop-blur-md sm:flex-row sm:items-center">
                  <input
                    type="email"
                    aria-label="Nhap email de nhan thong bao phong moi"
                    placeholder="Email của bạn"
                    className="w-full border-none bg-transparent px-4 text-white outline-none placeholder:text-white/50 sm:w-64"
                  />
                  <motion.button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="rounded-[24px] bg-white px-8 py-3 font-display text-sm font-bold text-primary transition-colors hover:bg-surface-container-lowest"
                    whileHover={motionTokens.hoverSoft}
                    whileTap={motionTokens.tap}
                  >
                    Đăng ký
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <StitchFooter />
    </div>
  );
}
