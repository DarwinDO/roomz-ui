import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoommateProfileModal } from "@/components/modals/RoommateProfileModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  useRoommateMatchesQuery,
  useRoommateProfileQuery,
  useRoommateRequestsQuery,
} from "@/hooks/useRoommatesQuery";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { trackFeatureEvent } from "@/services/analyticsTracking";
import { sendIntroMessage, type RoommateMatch } from "@/services/roommates";
import { IntroMessageModal } from "./IntroMessageModal";
import { LimitHitModal } from "./LimitHitModal";
import { LimitsBar } from "./LimitsBar";
import { RoommateFilters, type FilterOptions } from "./RoommateFilters";
import { RoommateResultsSkeleton } from "./RoommateCardSkeleton";
import { StitchFooter } from "@/components/common/StitchFooter";
import { stitchAssets } from "@/lib/stitchAssets";
import { openRoommateConversation } from "../../utils/openRoommateConversation";

type ScopeFilter = "all" | "same_district" | "same_city" | "outside_priority_area";
type AgePreset = "all" | "18-22" | "23-27" | "28-35";

const DEFAULT_FILTERS: FilterOptions = {
  gender: "any",
  ageMin: 18,
  ageMax: 40,
  budgetMin: 0,
  budgetMax: 10,
  occupation: "any",
};

function formatOccupationLabel(value: string | null | undefined) {
  switch (value) {
    case "student":
      return "Sinh viên";
    case "worker":
      return "Đi làm";
    case "freelancer":
      return "Freelancer";
    case "other":
      return "Linh hoạt";
    default:
      return "Đang cập nhật";
  }
}

function getScopeLabel(scope: RoommateMatch["match_scope"]) {
  switch (scope) {
    case "same_district":
      return "Ưu tiên khu vực";
    case "same_city":
      return "Cùng thành phố";
    default:
      return "Mở rộng kết nối";
  }
}

function getScopeDescription(scope: RoommateMatch["match_scope"]) {
  switch (scope) {
    case "same_district":
      return "Cùng bán kính tìm phòng";
    case "same_city":
      return "Cùng thành phố";
    default:
      return "Ngoài khu vực ưu tiên";
  }
}

function getAgeRange(agePreset: AgePreset) {
  switch (agePreset) {
    case "18-22":
      return { min: 18, max: 22 };
    case "23-27":
      return { min: 23, max: 27 };
    case "28-35":
      return { min: 28, max: 35 };
    default:
      return { min: 18, max: 40 };
  }
}

function getIntroStateLabel(match: RoommateMatch) {
  if (match.compatibility_score >= 95) {
    return "Premium match";
  }

  if (match.confidence_score >= 75) {
    return "Đã xác thực";
  }

  return "Đề xuất mới";
}

function getProfileSubtitle(match: RoommateMatch) {
  const parts = [];

  if (match.age) {
    parts.push(`${match.age} tuổi`);
  }

  if (match.university) {
    parts.push(match.university);
  } else if (match.occupation) {
    parts.push(formatOccupationLabel(match.occupation));
  }

  return parts.join(" • ") || "Thông tin đang được hoàn thiện";
}

function getLifestyleTags(match: RoommateMatch) {
  if (match.hobbies.length > 0) {
    return match.hobbies.slice(0, 3);
  }

  return ["Sạch sẽ", "Tôn trọng riêng tư", "Linh hoạt giờ giấc"];
}

function compactCityLabel(city?: string | null) {
  if (!city) {
    return "";
  }

  if (city === "Thành phố Hồ Chí Minh" || city === "Hồ Chí Minh") {
    return "TP.HCM";
  }

  if (city === "Thành phố Hà Nội") {
    return "Hà Nội";
  }

  return city.replace(/^Thành phố /, "").replace(/^Tỉnh /, "");
}

function buildAreaLabel(district?: string | null, city?: string | null) {
  return [district, compactCityLabel(city)].filter(Boolean).join(", ");
}

const ALL_LOCATION_VALUE = "__all";

export function RoommateResults() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile, setStatus } = useRoommateProfileQuery();
  const { matches, loading: matchesLoading, error, limits, canViewMore, canSendMore, recordView, refetch } =
    useRoommateMatchesQuery();
  const {
    sentRequests,
    receivedRequests,
    loading: requestsLoading,
    refetch: refetchRequests,
    checkConnection,
    checkOutgoingPending,
    checkIncomingPending,
    acceptRequest,
    isAccepting,
  } = useRoommateRequestsQuery();
  const { isPremium, loading: premiumLoading } = usePremiumLimits();

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [agePreset, setAgePreset] = useState<AgePreset>("all");
  const [locationFilter, setLocationFilter] = useState<string>(ALL_LOCATION_VALUE);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [selectedMatch, setSelectedMatch] = useState<RoommateMatch | null>(null);
  const [introModalTarget, setIntroModalTarget] = useState<RoommateMatch | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitType, setLimitType] = useState<"views" | "requests">("views");
  const [openingConversationUserId, setOpeningConversationUserId] = useState<string | null>(null);

  const isLoading = matchesLoading || (requestsLoading && matches.length === 0);

  const sentIntroMessages = useMemo(
    () =>
      new Set(
        sentRequests
          .filter((request) => request.message && request.status === "pending")
          .map((request) => request.receiver_id),
      ),
    [sentRequests],
  );

  const profileAreaLabel = useMemo(
    () => buildAreaLabel(profile?.district, profile?.city),
    [profile?.city, profile?.district],
  );

  const areaOptions = useMemo(() => {
    const options = new Set<string>();

    if (profileAreaLabel) {
      options.add(profileAreaLabel);
    }

    matches.forEach((match) => {
      const areaLabel = buildAreaLabel(match.district, match.city);
      if (areaLabel) {
        options.add(areaLabel);
      }
    });

    return Array.from(options);
  }, [matches, profileAreaLabel]);

  useEffect(() => {
    if (profileAreaLabel && locationFilter === ALL_LOCATION_VALUE) {
      setLocationFilter(profileAreaLabel);
    }
  }, [locationFilter, profileAreaLabel]);

  const filteredMatches = useMemo(() => {
    const ageRange = getAgeRange(agePreset);

    return matches
      .filter((match) => {
        const matchAreaLabel = buildAreaLabel(match.district, match.city);

        if (scopeFilter !== "all" && match.match_scope !== scopeFilter) {
          return false;
        }

        if (locationFilter !== ALL_LOCATION_VALUE && matchAreaLabel !== locationFilter) {
          return false;
        }

        if (filters.gender !== "any" && match.gender !== filters.gender) {
          return false;
        }

        if (filters.occupation !== "any" && match.occupation !== filters.occupation) {
          return false;
        }

        if (match.age && (match.age < ageRange.min || match.age > ageRange.max)) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        if (right.compatibility_score !== left.compatibility_score) {
          return right.compatibility_score - left.compatibility_score;
        }

        return right.confidence_score - left.confidence_score;
      });
  }, [agePreset, filters.gender, filters.occupation, locationFilter, matches, scopeFilter]);

  const fallbackCount = filteredMatches.filter((match) => match.match_scope === "outside_priority_area").length;
  const lowConfidenceCount = filteredMatches.filter((match) => match.confidence_score < 60).length;

  const handleViewProfile = async (match: RoommateMatch) => {
    if (!canViewMore) {
      setLimitType("views");
      setIsLimitModalOpen(true);
      return;
    }

    try {
      await recordView();
    } catch (recordError) {
      const message =
        recordError instanceof Error ? recordError.message : "Không thể mở hồ sơ vào lúc này.";
      if (message.includes("hết lượt xem profile")) {
        setLimitType("views");
        setIsLimitModalOpen(true);
        return;
      }
      toast.error(message);
      return;
    }

    setSelectedMatch(match);
    setIsProfileModalOpen(true);
    void trackFeatureEvent("roommate_profile_viewed", user?.id ?? null, {
      matched_user_id: match.matched_user_id,
      compatibility_score: match.compatibility_score,
      confidence_score: match.confidence_score,
      match_scope: match.match_scope,
    });
  };

  const handleStartChat = async (targetUserId: string) => {
    setOpeningConversationUserId(targetUserId);

    try {
      await openRoommateConversation({
        currentUserId: user?.id,
        otherUserId: targetUserId,
        navigate,
      });
    } catch (error) {
      console.error("[RoommateResults] Failed to open conversation:", error);
      const message =
        error instanceof Error ? error.message : "Không thể mở cuộc trò chuyện lúc này.";
      toast.error(message);
    } finally {
      setOpeningConversationUserId((current) => (current === targetUserId ? null : current));
    }
  };

  const handleOpenIntroModal = (match: RoommateMatch) => {
    if (checkConnection(match.matched_user_id)) {
      void handleStartChat(match.matched_user_id);
      return;
    }

    if (sentIntroMessages.has(match.matched_user_id)) {
      toast.info("Bạn đã gửi lời chào cho người này rồi.");
      return;
    }

    if (!canSendMore) {
      setLimitType("requests");
      setIsLimitModalOpen(true);
      return;
    }

    setIntroModalTarget(match);
    setIsIntroModalOpen(true);
  };

  const handleSendIntroMessage = async (message: string) => {
    if (!introModalTarget || !user?.id) {
      return;
    }

    try {
      await sendIntroMessage(user.id, introModalTarget.matched_user_id, message);
      void trackFeatureEvent("roommate_intro_sent", user.id, {
        matched_user_id: introModalTarget.matched_user_id,
        message_length: message.trim().length,
        compatibility_score: introModalTarget.compatibility_score,
      });
      await queryClient.invalidateQueries({ queryKey: ["roommate", "limits", user.id] });
      await refetchRequests();
      toast.success("Đã gửi lời chào.");
    } catch (sendError) {
      const messageText =
        sendError instanceof Error ? sendError.message : "Không thể gửi lời chào. Vui lòng thử lại.";
      if (messageText.includes("hết lượt gửi yêu cầu")) {
        setLimitType("requests");
        setIsLimitModalOpen(true);
      }
      toast.error(messageText);
      throw sendError;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <div className="mb-10 max-w-3xl space-y-3">
            <div className="h-8 w-32 rounded-full bg-surface-container-high" />
            <div className="h-14 w-full max-w-2xl rounded-3xl bg-surface-container-high" />
            <div className="h-6 w-full max-w-xl rounded-full bg-surface-container-low" />
          </div>
          <RoommateResultsSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-24">
          <Card className="max-w-lg rounded-[32px] border border-outline-variant/20 p-10 text-center shadow-sm">
            <h1 className="text-3xl text-on-surface">Chưa thể tải danh sách ghép đôi</h1>
            <p className="mt-3 text-base leading-8 text-on-surface-variant">
              {error}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button onClick={() => refetch()}>Thử lại</Button>
              <Button variant="outline" onClick={() => navigate("/roommates/profile")}>
                Cập nhật hồ sơ
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-24">
        <section className="relative overflow-hidden px-2 py-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="mb-6 inline-flex rounded-full bg-secondary-container px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-on-secondary-container">
                Connect &amp; Live
              </span>
              <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.05] text-on-surface md:text-7xl">
                Tìm người bạn{" "}
                <span className="text-primary italic">đồng hành</span>{" "}
                hoàn hảo
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-on-surface-variant md:text-xl">
                Khám phá những hồ sơ phù hợp với khu vực, nhịp sống và kỳ vọng chi tiêu của bạn để bắt đầu hành trình ở ghép rõ ràng hơn.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button
                  className="stitch-primary-gradient h-14 rounded-full px-8 text-base font-bold text-white"
                  onClick={() => navigate("/roommates/profile")}
                >
                  Cập nhật hồ sơ của bạn
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-14 rounded-full border-outline-variant/50 bg-white/80 px-8 text-base"
                  onClick={() => navigate("/roommates/requests")}
                >
                  Xem lời chào đang chờ
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 bottom-4 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -right-6 top-2 h-48 w-48 rounded-full bg-tertiary/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] shadow-[0_32px_90px_rgba(40,43,81,0.16)]">
                <img
                  src={stitchAssets.roommates.heroImage}
                  alt="Nhóm bạn trẻ cùng tìm bạn ở ghép"
                  className="h-[520px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="-mt-2 mb-14">
          <div className="rounded-[32px] border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-[0_18px_48px_rgba(40,43,81,0.06)]">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.28fr)_minmax(0,0.92fr)_minmax(0,1.02fr)_minmax(220px,0.95fr)]">
              <label className="min-w-0 space-y-2">
                <span className="block px-1 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Khu vực
                </span>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger
                    aria-label="Lọc theo khu vực"
                    className="h-14 w-full rounded-full border-none bg-surface-container-low px-5 text-sm font-semibold text-on-surface shadow-none focus-visible:ring-primary/20 [&>span]:min-w-0 [&>span]:truncate"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <SelectValue placeholder="Chọn khu vực" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value={ALL_LOCATION_VALUE}>Tất cả khu vực</SelectItem>
                    {areaOptions.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="block px-1 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Độ tuổi
                </span>
                <div className="flex h-14 items-center rounded-full bg-surface-container-low px-5">
                  <Eye className="mr-3 h-4 w-4 text-primary" />
                  <select
                    value={agePreset}
                    onChange={(event) => setAgePreset(event.target.value as AgePreset)}
                    className="w-full border-none bg-transparent p-0 text-sm font-semibold text-on-surface focus:outline-none focus:ring-0"
                    aria-label="Lọc theo độ tuổi"
                  >
                    <option value="all">18 - 40 tuổi</option>
                    <option value="18-22">18 - 22 tuổi</option>
                    <option value="23-27">23 - 27 tuổi</option>
                    <option value="28-35">28 - 35 tuổi</option>
                  </select>
                </div>
              </label>

              <label className="space-y-2">
                <span className="block px-1 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Nghề nghiệp
                </span>
                <div className="flex h-14 items-center rounded-full bg-surface-container-low px-5">
                  <Briefcase className="mr-3 h-4 w-4 text-primary" />
                  <select
                    value={filters.occupation}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        occupation: event.target.value as FilterOptions["occupation"],
                      }))
                    }
                    className="w-full border-none bg-transparent p-0 text-sm font-semibold text-on-surface focus:outline-none focus:ring-0"
                    aria-label="Lọc theo nghề nghiệp"
                  >
                    <option value="any">Tất cả nghề nghiệp</option>
                    <option value="student">Sinh viên</option>
                    <option value="worker">Đi làm</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </div>
              </label>

              <div className="space-y-2">
                <span className="block px-1 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Hành động
                </span>
                <Button
                  className="stitch-primary-gradient h-14 w-full rounded-full text-sm font-bold text-white hover:opacity-95"
                  onClick={() => {
                    document.getElementById("roommate-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Lọc kết quả
                </Button>
              </div>
            </div>
          </div>
        </section>

        {profile?.status === "paused" ? (
          <div className="mb-6 rounded-[28px] border border-secondary-container/60 bg-secondary-container/35 px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-secondary">Hồ sơ đang tạm ẩn</p>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">
                  Người khác chưa thể nhìn thấy bạn trên bảng ghép đôi cho tới khi bạn bật lại chế độ tìm roommate.
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-secondary/20 bg-white"
                onClick={() => setStatus("looking")}
              >
                Bật tìm kiếm trở lại
              </Button>
            </div>
          </div>
        ) : null}

        <LimitsBar
          limits={limits}
          isPremium={isPremium || premiumLoading}
          onUpgrade={() => navigate("/payment")}
        />

        {(fallbackCount > 0 || lowConfidenceCount > 0) && (
          <div className="mb-8 rounded-[28px] border border-outline-variant/15 bg-white px-6 py-5 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-1 text-sm leading-7 text-on-surface-variant">
                {fallbackCount > 0 ? (
                  <p>
                    {fallbackCount} hồ sơ đang được mở rộng ngoài khu vực ưu tiên để tránh màn hình trống.
                  </p>
                ) : null}
                {lowConfidenceCount > 0 ? (
                  <p>
                    {lowConfidenceCount} hồ sơ có độ tin cậy dữ liệu thấp hơn. Hoàn thiện district, budget và thời điểm chuyển vào để hệ gợi ý sát hơn.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <section id="roommate-results" className="mb-18">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-on-surface">Người tìm bạn gần đây</h2>
              <p className="mt-2 text-on-surface-variant">
                {filteredMatches.length} hồ sơ phù hợp với khu vực và hành vi sống mà bạn đã chọn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden gap-2 md:flex">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/40 bg-white text-on-surface transition-colors hover:bg-surface-container-low"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/40 bg-white text-on-surface transition-colors hover:bg-surface-container-low"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <RoommateFilters filters={filters} onFiltersChange={setFilters} resultCount={filteredMatches.length} />

              <select
                value={scopeFilter}
                onChange={(event) => setScopeFilter(event.target.value as ScopeFilter)}
                className="h-12 rounded-full border border-outline-variant/40 bg-white px-5 text-sm font-semibold text-on-surface"
                aria-label="Lọc theo phạm vi ghép đôi"
              >
                <option value="all">Tất cả gợi ý</option>
                <option value="same_district">Ưu tiên cùng quận</option>
                <option value="same_city">Cùng thành phố</option>
                <option value="outside_priority_area">Mở rộng ngoài vùng</option>
              </select>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <Card className="rounded-[32px] border border-outline-variant/20 bg-white p-12 text-center shadow-sm">
              <h3 className="text-2xl text-on-surface">Chưa có hồ sơ phù hợp</h3>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-on-surface-variant">
                Hãy nới rộng khu vực, tuổi ưu tiên hoặc cập nhật hồ sơ để hệ thống gợi ý thêm người phù hợp với bạn.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button onClick={() => navigate("/roommates/profile")}>Cập nhật hồ sơ</Button>
                <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Đặt lại bộ lọc
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredMatches.map((match) => {
                const isConnected = checkConnection(match.matched_user_id);
                const hasPendingRequest = checkOutgoingPending(match.matched_user_id);
                const isIncomingPending = checkIncomingPending(match.matched_user_id);
                const lifestyleTags = getLifestyleTags(match);

                return (
                  <article
                    key={match.matched_user_id}
                    className="group rounded-[28px] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-[0_16px_40px_rgba(40,43,81,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(40,43,81,0.08)]"
                  >
                    <div className="mb-6 flex items-start gap-4">
                      <img
                        src={match.avatar_url || stitchAssets.landing.friendAvatars[0]}
                        alt={match.full_name}
                        className="h-20 w-20 rounded-[20px] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-xl font-bold text-on-surface">{match.full_name}</h3>
                          <span className="rounded-full bg-tertiary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-on-tertiary-container">
                            {match.compatibility_score}% Match
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant">{getProfileSubtitle(match)}</p>
                        <span className="mt-2 inline-flex rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-secondary-container">
                          {getIntroStateLabel(match)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-on-surface-variant">
                          Khu vực:{" "}
                          <span className="font-semibold text-on-surface">
                            {[match.district, match.city].filter(Boolean).join(", ") || "Đang cập nhật"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <span className="text-on-surface-variant">
                          Trạng thái:{" "}
                          <span className="font-semibold text-on-surface">{getScopeDescription(match.match_scope)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <span className="text-on-surface-variant">
                          Nghề nghiệp:{" "}
                          <span className="font-semibold text-on-surface">
                            {formatOccupationLabel(match.occupation)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="my-6 flex flex-wrap gap-2">
                      <span className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant">
                        {getScopeLabel(match.match_scope)}
                      </span>
                      {lifestyleTags.map((tag) => (
                        <span
                          key={`${match.matched_user_id}-${tag}`}
                          className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="rounded-full border-primary/40 text-primary hover:bg-primary/5"
                        onClick={() => handleViewProfile(match)}
                      >
                        Xem hồ sơ
                      </Button>
                      {isConnected ? (
                        <Button
                          className="stitch-primary-gradient rounded-full text-white"
                          onClick={() => void handleStartChat(match.matched_user_id)}
                          disabled={openingConversationUserId === match.matched_user_id}
                        >
                          {openingConversationUserId === match.matched_user_id ? "Đang mở..." : "Nhắn tin"}
                        </Button>
                      ) : isIncomingPending ? (
                        <Button
                          className="stitch-primary-gradient rounded-full text-white"
                          onClick={() => {
                            const request = receivedRequests.find(
                              (entry) =>
                                entry.sender_id === match.matched_user_id && entry.status === "pending",
                            );

                            if (request) {
                              void acceptRequest(request.id);
                            }
                          }}
                          disabled={isAccepting}
                        >
                          Chấp nhận
                        </Button>
                      ) : hasPendingRequest || sentIntroMessages.has(match.matched_user_id) ? (
                        <Button
                          className="rounded-full bg-surface-container-highest text-primary hover:bg-surface-container-highest"
                          disabled
                        >
                          Đã gửi lời chào
                        </Button>
                      ) : (
                        <Button
                          className="stitch-primary-gradient rounded-full text-white"
                          onClick={() => handleOpenIntroModal(match)}
                        >
                          Nhắn tin
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-16">
          <div className="stitch-primary-gradient rounded-[32px] px-8 py-10 text-center text-white md:px-14 md:py-14">
            <h2 className="text-4xl font-bold">Chưa tìm thấy người phù hợp?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-blue-50/90">
              Hãy để chúng tôi gợi ý thêm bằng cách mở rộng hồ sơ, cập nhật thói quen sống hoặc kết nối trực tiếp với những người đang chờ lời chào của bạn.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                variant="outline"
                className="h-12 rounded-full border-white/60 bg-white text-primary hover:bg-white/90"
                onClick={() => navigate("/roommates/profile")}
              >
                Điều chỉnh hồ sơ
              </Button>
              <Button
                className="h-12 rounded-full bg-surface-container-lowest px-6 text-primary hover:bg-surface-container-lowest/90"
                onClick={() => navigate("/roommates/requests")}
              >
                Quản lý lời chào
              </Button>
            </div>
          </div>
        </section>
      </main>

      <StitchFooter />

      {selectedMatch ? (
        <RoommateProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          roommate={selectedMatch}
          onMessageClick={() => {
            void handleStartChat(selectedMatch.matched_user_id);
          }}
          onSendRequest={() => {
            setIsProfileModalOpen(false);
            handleOpenIntroModal(selectedMatch);
          }}
          connectionStatus={
            checkConnection(selectedMatch.matched_user_id)
              ? "connected"
              : checkOutgoingPending(selectedMatch.matched_user_id)
                ? "pending_sent"
                : checkIncomingPending(selectedMatch.matched_user_id)
                  ? "pending_received"
                  : "none"
          }
          isRequestLoading={requestsLoading}
        />
      ) : null}

      <LimitHitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        limitType={limitType}
        onUpgrade={() => navigate("/payment")}
      />

      <IntroMessageModal
        open={isIntroModalOpen}
        onClose={() => {
          setIsIntroModalOpen(false);
          setIntroModalTarget(null);
        }}
        match={introModalTarget}
        onSend={handleSendIntroMessage}
      />
    </div>
  );
}
