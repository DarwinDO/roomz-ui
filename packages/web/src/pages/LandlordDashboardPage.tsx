import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCallback } from "react";
import { useRef } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isThisMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Home,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts";
import { useLandlordBookings } from "@/hooks/useBookings";
import { useConversationMessages, useConversations, type Conversation } from "@/hooks/useMessages";
import { useLandlordRooms } from "@/hooks/useRooms";
import { createPublicMotion } from "@/lib/motion";
import { stitchAssets } from "@/lib/stitchAssets";
import { cn, formatCurrency, formatMillions } from "@/lib/utils";
import type { BookingWithDetails } from "@/services/bookings";
import { getOrCreateConversation as ensureConversation } from "@/services/messages";
import type { RoomWithDetails } from "@/services/rooms";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const DASHBOARD_TAB_VALUES = ["overview", "listings", "appointments", "messages", "income"] as const;
type DashboardTabValue = (typeof DASHBOARD_TAB_VALUES)[number];

const LISTING_FILTER_VALUES = ["all", "active"] as const;
type ListingFilterValue = (typeof LISTING_FILTER_VALUES)[number];

function normalizeDashboardTab(rawTab: string | null): DashboardTabValue {
  switch (rawTab) {
    case "listings":
    case "my-rooms":
      return "listings";
    case "appointments":
    case "bookings":
    case "pending":
    case "confirmed":
    case "history":
      return "appointments";
    case "messages":
      return "messages";
    case "income":
      return "income";
    case "overview":
    default:
      return "overview";
  }
}

function getDashboardTabMeta(tab: DashboardTabValue) {
  switch (tab) {
    case "listings":
      return {
        eyebrow: "Quản lý tin",
        title: "Tin đăng chủ nhà",
        body:
          "Giữ các tin đăng rõ ràng, dễ duyệt và đủ tín hiệu tin cậy để chuyển lịch hẹn thành khách thật nhanh hơn.",
      };
    case "appointments":
      return {
        eyebrow: "Lịch hẹn",
        title: "Lịch hẹn chủ nhà",
        body:
          "Theo dõi các yêu cầu đang chờ, lịch sắp tới và nhịp xử lý trong cùng một màn hình có ngữ cảnh rõ hơn.",
      };
    case "messages":
      return {
        eyebrow: "Hộp thư",
        title: "Tin nhắn chủ nhà",
        body:
          "Ưu tiên các cuộc trò chuyện gần nhất, xem nhanh ai đang chờ phản hồi và mở hộp thư đầy đủ khi cần xử lý sâu.",
      };
    case "income":
      return {
        eyebrow: "Tổng quan thu nhập",
        title: "Thu nhập chủ nhà",
        body:
          "Xem sức chứa doanh thu theo tin đang hiển thị, nhịp quan tâm của khách và các tín hiệu đang kéo hiệu suất lên hoặc xuống.",
      };
    case "overview":
    default:
      return {
        eyebrow: "Tổng quan",
        title: "Bảng điều khiển chủ nhà",
        body:
          "Theo dõi tin đăng, lịch hẹn và những việc cần xử lý trong cùng một nhịp. Giao diện này bám screen Stitch mới nhưng vẫn dùng dữ liệu thật và các hành động hiện có của RommZ.",
      };
  }
}

function getRoomCover(room: RoomWithDetails) {
  return room.images?.[0]?.image_url || stitchAssets.roomDetail.related[0];
}

function getBookingGuestName(booking: BookingWithDetails) {
  return booking.renter?.full_name?.trim() || booking.renter?.email || "Khách mới";
}

function formatBookingMoment(value: string | null | undefined) {
  if (!value) {
    return "Chưa chốt lịch";
  }

  try {
    return format(parseISO(value), "dd/MM • HH:mm", { locale: vi });
  } catch {
    return "Chưa chốt lịch";
  }
}

function statusChipTone(status: RoomWithDetails["status"]) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "rejected":
      return "border-slate-200 bg-surface-container text-on-surface-variant";
    default:
      return "border-border bg-surface-container-low text-on-surface-variant";
  }
}

function statusChipLabel(status: RoomWithDetails["status"]) {
  switch (status) {
    case "active":
      return "Đang hiển thị";
    case "pending":
      return "Đợi duyệt";
    case "rejected":
      return "Cần sửa";
    default:
      return "Tạm ẩn";
  }
}

export default function LandlordDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const motionTokens = useMemo(() => createPublicMotion(!!shouldReduceMotion), [shouldReduceMotion]);
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    confirmBooking,
    rejectBooking,
    completeBooking,
    refetch: refetchBookings,
  } = useLandlordBookings();
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    stats: roomStats,
    refetch: refetchRooms,
  } = useLandlordRooms(user?.id);
  const {
    conversations,
    unreadCount: messagesUnreadCount,
    loading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations();

  const [listingFilter, setListingFilter] = useState<ListingFilterValue>("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "reject" | "complete" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const activeTab = useMemo<DashboardTabValue>(
    () => normalizeDashboardTab(searchParams.get("tab")),
    [searchParams],
  );
  const tabMeta = useMemo(() => getDashboardTabMeta(activeTab), [activeTab]);
  const hostDisplayName =
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Host";

  const loading = bookingsLoading || roomsLoading;
  const error = bookingsError || roomsError;

  const activeRooms = useMemo(() => rooms.filter((room) => room.status === "active"), [rooms]);
  const pendingRooms = useMemo(() => rooms.filter((room) => room.status === "pending"), [rooms]);
  const rejectedRooms = useMemo(() => rooms.filter((room) => room.status === "rejected"), [rooms]);

  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.status === "pending"), [bookings]);
  const confirmedBookings = useMemo(() => bookings.filter((booking) => booking.status === "confirmed"), [bookings]);
  const historyBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "completed" || booking.status === "cancelled"),
    [bookings],
  );

  const todayAppointments = useMemo(
    () =>
      bookings.filter((booking) => {
        if (!booking.booking_date) {
          return false;
        }

        try {
          return (
            (booking.status === "pending" || booking.status === "confirmed") &&
            isSameDay(parseISO(booking.booking_date), new Date())
          );
        } catch {
          return false;
        }
      }).length,
    [bookings],
  );

  const estimatedMonthlyIncome = useMemo(
    () =>
      activeRooms.reduce((total, room) => {
        const price = Number(room.price_per_month || 0);
        return Number.isFinite(price) ? total + price : total;
      }, 0),
    [activeRooms],
  );

  const currentMonthCompleted = useMemo(
    () =>
      bookings.filter((booking) => {
        if (booking.status !== "completed" || !booking.booking_date) {
          return false;
        }

        try {
          return isThisMonth(parseISO(booking.booking_date));
        } catch {
          return false;
        }
      }).length,
    [bookings],
  );

  const trustScore = useMemo(() => {
    const rawScore =
      7.1 +
      Math.min(activeRooms.length * 0.14, 1.1) +
      Math.min(roomStats.totalFavorites / 45, 0.8) +
      Math.min(currentMonthCompleted * 0.06, 0.5) -
      Math.min(rejectedRooms.length * 0.18, 0.9);

    return Math.max(6.4, Math.min(9.9, rawScore)).toFixed(1);
  }, [activeRooms.length, currentMonthCompleted, rejectedRooms.length, roomStats.totalFavorites]);

  const managedRooms = useMemo(
    () => [...activeRooms, ...pendingRooms, ...rejectedRooms],
    [activeRooms, pendingRooms, rejectedRooms],
  );

  const overviewRooms = useMemo(() => {
    const source = listingFilter === "active" ? activeRooms : managedRooms;
    return source.slice(0, 3);
  }, [activeRooms, listingFilter, managedRooms]);

  const queueBookings = useMemo(() => pendingBookings.slice(0, 2), [pendingBookings]);

  const qualitySignals = useMemo(() => {
    const listingsMissingImages = managedRooms.filter((room) => (room.images?.length || 0) < 3).length;
    const listingsMissingDescription = managedRooms.filter(
      (room) => !room.description || room.description.trim().length < 80,
    ).length;

    return [
      rejectedRooms.length === 0
        ? {
            tone: "good" as const,
            title: "Xác thực và duyệt tin đang ổn",
            detail: "Không có tin nào bị trả về cần sửa lại ngay.",
          }
        : {
            tone: "warn" as const,
            title: `${rejectedRooms.length} tin cần chỉnh lại nội dung`,
            detail: "Mở tab Tin đăng để sửa ảnh, mô tả hoặc mức giá rồi gửi duyệt lại.",
          },
      pendingRooms.length === 0
        ? {
            tone: "good" as const,
            title: "Không có tin chờ duyệt kéo dài",
            detail: "Toàn bộ tin đang ở trạng thái hiển thị hoặc đã xử lý xong.",
          }
        : {
            tone: "warn" as const,
            title: `${pendingRooms.length} tin đang chờ duyệt`,
            detail: "Theo dõi và chuẩn bị ảnh/mô tả rõ hơn nếu cần chỉnh sau vòng duyệt.",
          },
      listingsMissingImages + listingsMissingDescription === 0
        ? {
            tone: "good" as const,
            title: "Ảnh và mô tả đang đủ lực chuyển đổi",
            detail: "Các tin đăng có đủ ảnh và phần mô tả để tránh cảm giác thông tin còn mỏng.",
          }
        : {
            tone: "warn" as const,
            title: "Một số tin còn mỏng về nội dung",
            detail: `${listingsMissingImages} tin thiếu ảnh mạnh, ${listingsMissingDescription} tin cần mô tả chi tiết hơn.`,
          },
    ];
  }, [managedRooms, pendingRooms.length, rejectedRooms.length]);

  const incomeRows = useMemo(
    () =>
      [...activeRooms]
        .sort((left, right) => Number(right.price_per_month || 0) - Number(left.price_per_month || 0))
        .slice(0, 5),
    [activeRooms],
  );

  const setDashboardTab = (nextTab: DashboardTabValue) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("tab", nextTab);
      return nextParams;
    });
  };

  const handleOpenBookingConversation = async (booking: BookingWithDetails) => {
    if (!user?.id || !booking.renter_id) {
      toast.error("Không thể mở hội thoại cho lịch hẹn này.");
      return;
    }

    try {
      const conversationId = await ensureConversation(
        user.id,
        booking.renter_id,
        booking.room_id,
        booking.room?.title ?? null,
      );
      navigate(`/messages/${conversationId}`);
    } catch (conversationError) {
      const message =
        conversationError instanceof Error
          ? conversationError.message
          : "Không thể mở hội thoại với khách thuê lúc này.";
      toast.error(message);
    }
  };

  const closeActionDialog = () => {
    setSelectedBooking(null);
    setActionType(null);
    setActionNotes("");
  };

  const openActionDialog = (booking: BookingWithDetails, type: "confirm" | "reject" | "complete") => {
    setSelectedBooking(booking);
    setActionType(type);
    setActionNotes("");
  };

  const handleAction = async () => {
    if (!selectedBooking || !actionType) {
      return;
    }

    setIsProcessing(true);
    try {
      if (actionType === "confirm") {
        await confirmBooking(selectedBooking.id, actionNotes);
        toast.success("Đã xác nhận lịch hẹn");
      }

      if (actionType === "reject") {
        await rejectBooking(selectedBooking.id, actionNotes);
        toast.success("Đã từ chối lịch hẹn");
      }

      if (actionType === "complete") {
        await completeBooking(selectedBooking.id, actionNotes);
        toast.success("Đã đánh dấu lịch hẹn hoàn thành");
      }

      closeActionDialog();
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Không thể thực hiện thao tác. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải bảng điều khiển chủ nhà...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-warning" />
          <h2 className="mb-2 text-xl font-semibold">Vui lòng đăng nhập</h2>
          <p className="mb-6 text-muted-foreground">Bạn cần đăng nhập để truy cập bảng điều khiển chủ nhà.</p>
          <Button onClick={() => navigate("/login")}>Đăng nhập</Button>
        </div>
      </div>
    );
  }

  return (
    <div lang="vi" className="min-h-screen bg-background pb-24">
      <motion.div
        className="mx-auto max-w-[1520px] px-4 pt-28 pb-16 sm:px-6 lg:px-8"
        initial="hidden"
        animate="show"
        variants={motionTokens.stagger(0.08, 0.02)}
      >
        <motion.section
          className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"
          variants={motionTokens.reveal(18)}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
              {tabMeta.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-on-surface md:text-5xl">
              {tabMeta.title}
            </h1>
            <p className="mt-3 max-w-[68ch] text-sm leading-7 text-on-surface-variant md:text-base">
              {tabMeta.body}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-full border-border/70 bg-surface-container-lowest px-5"
              onClick={() => setDashboardTab("messages")}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Tin nhắn
              {messagesUnreadCount > 0 ? (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                  {messagesUnreadCount > 9 ? "9+" : messagesUnreadCount}
                </span>
              ) : null}
            </Button>
            <Button className="rounded-full px-5 shadow-lg shadow-primary/20" onClick={() => navigate("/post-room")}>
              <Plus className="mr-2 h-4 w-4" />
              Đăng tin mới
            </Button>
          </div>
        </motion.section>

        <motion.div
          className="mb-10 rounded-[2rem] border border-border/70 bg-surface-container-lowest p-2 shadow-soft"
          variants={motionTokens.revealScale(14, 0.995)}
        >
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_TAB_VALUES.map((tabValue) => {
              const label =
                tabValue === "overview"
                  ? "Tổng quan"
                  : tabValue === "listings"
                    ? "Tin đăng"
                    : tabValue === "appointments"
                      ? "Lịch hẹn"
                      : tabValue === "messages"
                        ? "Tin nhắn"
                        : "Thu nhập";

              return (
                <motion.button
                  key={tabValue}
                  type="button"
                  onClick={() => setDashboardTab(tabValue)}
                  className={cn(
                    "rounded-full px-5 py-3 text-sm font-semibold transition-all",
                    activeTab === tabValue
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                  )}
                  whileHover={activeTab === tabValue ? undefined : motionTokens.hoverSoft}
                  whileTap={motionTokens.tap}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {error ? (
          <div className="mb-6 flex items-center gap-3 rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto rounded-full"
              onClick={() => {
                void refetchBookings();
                void refetchRooms();
                void refetchConversations();
              }}
            >
              Thử lại
            </Button>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
        {activeTab === "overview" ? (
          <motion.section
            key="host-overview"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={motionTokens.reveal(16)}
          >
            <section className="mb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Tin đăng đang hoạt động"
                value={activeRooms.length.toString().padStart(2, "0")}
                badge={activeRooms.length > 0 ? `+${pendingRooms.length} chờ duyệt` : undefined}
                badgeTone="good"
              />
              <MetricCard
                label="Lịch hẹn hôm nay"
                value={todayAppointments.toString().padStart(2, "0")}
                icon={<CalendarCheck className="h-4 w-4 text-primary" />}
              />
              <MetricCard
                label="Yêu cầu mới"
                value={pendingBookings.length.toString().padStart(2, "0")}
                badge={pendingBookings.length > 0 ? "Khẩn cấp" : undefined}
                badgeTone="warn"
                valueClassName="text-secondary"
              />
              <MetricCard
                label="Điểm tin cậy"
                value={trustScore}
                icon={<CheckCircle className="h-4 w-4 text-tertiary" />}
                valueClassName="text-tertiary"
              />
            </section>

            <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
              <div className="space-y-8 xl:col-span-8">
                <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
                  <CardHeader className="flex flex-col gap-5 border-b border-border/50 pb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="font-display text-2xl font-extrabold tracking-[-0.03em]">
                        Quản lý tin đăng
                      </CardTitle>
                      <CardDescription className="mt-2 max-w-[52ch] text-sm leading-6">
                        Dùng thẻ này để xem nhanh những tin đăng quan trọng nhất, sau đó chuyển sang tab Tin đăng khi
                        cần chỉnh sâu hơn.
                      </CardDescription>
                    </div>

                    <div className="flex gap-2 rounded-full bg-surface-container p-1">
                      {LISTING_FILTER_VALUES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setListingFilter(value)}
                          className={cn(
                            "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                            listingFilter === value
                              ? "bg-surface-container-lowest text-on-surface shadow-sm"
                              : "text-on-surface-variant hover:text-on-surface",
                          )}
                        >
                          {value === "all" ? "Tất cả" : "Đang hiển thị"}
                        </button>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-6">
                    {overviewRooms.length === 0 ? (
                      <EmptyStateCard
                        title="Chưa có tin để hiển thị"
                        body="Đăng tin đầu tiên để bắt đầu theo dõi hiệu suất và lịch hẹn tại đây."
                        actionLabel="Đăng tin mới"
                        onAction={() => navigate("/post-room")}
                      />
                    ) : (
                      overviewRooms.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => navigate(`/room/${room.id}`)}
                          className="group flex w-full items-center gap-4 rounded-[1.5rem] p-4 text-left transition-colors hover:bg-surface-container-low"
                        >
                          <img
                            src={getRoomCover(room)}
                            alt={room.title}
                            className="h-20 w-24 rounded-[1rem] object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-on-surface">{room.title}</p>
                            <p className="mt-1 truncate text-sm text-on-surface-variant">{room.address}</p>
                          </div>

                          <div className="hidden min-w-[160px] flex-col items-end gap-2 text-right md:flex">
                            <Badge variant="outline" className={cn("rounded-full border", statusChipTone(room.status))}>
                              {statusChipLabel(room.status)}
                            </Badge>
                            <p className="text-sm font-semibold text-on-surface">
                              {Number(room.price_per_month || 0) > 0
                                ? `${formatMillions(Number(room.price_per_month))}/tháng`
                                : "Đang cập nhật"}
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 text-outline transition-transform group-hover:translate-x-1" />
                        </button>
                      ))
                    )}

                    <Button
                      variant="ghost"
                      className="rounded-full px-0 text-primary"
                      onClick={() => setDashboardTab("listings")}
                    >
                      Xem tất cả tin đăng
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-[2rem] border-none bg-primary text-white shadow-soft-lg">
                  <CardContent className="relative p-8">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white/80">Thu nhập tháng này</p>
                        <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-white">
                          {estimatedMonthlyIncome > 0 ? formatCurrency(estimatedMonthlyIncome) : "0đ"}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-white/80">
                          Ước tính từ {activeRooms.length} tin đang hiển thị. Khi phase thu nhập sâu hơn được port,
                          màn này sẽ nối thêm dữ liệu thanh toán thực tế.
                        </p>
                      </div>

                      <div className="md:text-right">
                        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                          {currentMonthCompleted > 0
                            ? `${currentMonthCompleted} lịch đã hoàn thành tháng này`
                            : "Theo dõi dòng tiền ổn định"}
                        </span>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            className="rounded-full border-white/25 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
                            onClick={() => setDashboardTab("income")}
                          >
                            Xem báo cáo chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-primary-container/20" />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8 xl:col-span-4">
                <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-5">
                    <div>
                      <CardTitle className="font-display text-xl font-extrabold tracking-[-0.03em]">
                        Yêu cầu mới
                      </CardTitle>
                      <CardDescription className="mt-2 text-sm leading-6">
                        Ưu tiên phản hồi sớm để không rớt conversion của khách.
                      </CardDescription>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDashboardTab("appointments")}
                      className="text-sm font-semibold text-primary"
                    >
                      Xem tất cả
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {queueBookings.length === 0 ? (
                      <EmptyStateCard
                        title="Chưa có yêu cầu mới"
                        body="Khi có khách đặt lịch xem, các request cần xử lý sẽ xuất hiện ở đây."
                      />
                    ) : (
                      queueBookings.map((booking) => (
                        <div key={booking.id} className="rounded-[1.5rem] bg-surface-container p-4">
                          <div className="flex items-start gap-3">
                            <PremiumAvatar
                              isPremium={booking.renter?.is_premium ?? false}
                              className="h-12 w-12 border border-white"
                            >
                              <AvatarImage src={booking.renter?.avatar_url || undefined} />
                              <AvatarFallback>{getBookingGuestName(booking).slice(0, 2).toUpperCase()}</AvatarFallback>
                            </PremiumAvatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-on-surface">{getBookingGuestName(booking)}</p>
                                  <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                                    {booking.room?.title || "Yêu cầu xem phòng"}
                                  </p>
                                </div>
                                <Badge className="rounded-full bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container">
                                  {booking.renter?.phone_verified ? "Match tốt" : "Mới"}
                                </Badge>
                              </div>

                              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                                {booking.note?.trim() || "Khách muốn chốt lịch xem sớm và cần bạn phản hồi ngay tại đây."}
                              </p>

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                                  {formatBookingMoment(booking.booking_date)}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full px-4"
                                    onClick={() => openActionDialog(booking, "reject")}
                                  >
                                    Từ chối
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-full px-4"
                                    onClick={() => openActionDialog(booking, "confirm")}
                                  >
                                    Chấp nhận
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="font-display text-xl font-extrabold tracking-[-0.03em]">
                      Chất lượng nội dung
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6">
                      Những tín hiệu giúp mỗi tin giữ độ tin cậy và giảm nguy cơ phải duyệt lại.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {qualitySignals.map((signal) => (
                      <div key={signal.title} className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-1 flex h-6 w-6 items-center justify-center rounded-full",
                            signal.tone === "good"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {signal.tone === "good" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <ShieldAlert className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{signal.title}</p>
                          <p className="mt-1 text-sm leading-6 text-on-surface-variant">{signal.detail}</p>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="mt-2 w-full rounded-full"
                      onClick={() => setDashboardTab("listings")}
                    >
                      Cải thiện ngay
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </motion.section>
        ) : null}

        {activeTab === "listings" ? (
          <motion.section
            key="host-listings"
            className="space-y-8"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={motionTokens.reveal(16)}
          >
            <ListingsInsightStrip
              hostName={hostDisplayName}
              managedRooms={managedRooms}
              pendingRooms={pendingRooms}
              activeRooms={activeRooms}
              totalViews={roomStats.totalViews}
              totalFavorites={roomStats.totalFavorites}
              qualitySignals={qualitySignals}
              onCreateListing={() => navigate("/post-room")}
              onGoIncome={() => setDashboardTab("income")}
              onOpenListing={(roomId) => navigate(`/room/${roomId}`)}
              onEditListing={(roomId) => navigate(`/post-room?edit=${roomId}`)}
            />
          </motion.section>
        ) : null}

        {activeTab === "appointments" ? (
          <motion.section
            key="host-appointments"
            className="space-y-8"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={motionTokens.reveal(16)}
          >
            <AppointmentsOverviewStrip
              bookings={bookings}
              pendingBookings={pendingBookings}
              confirmedBookings={confirmedBookings}
              historyBookings={historyBookings}
              onConfirm={(booking) => openActionDialog(booking, "confirm")}
              onReject={(booking) => openActionDialog(booking, "reject")}
              onComplete={(booking) => openActionDialog(booking, "complete")}
              onMessageGuest={handleOpenBookingConversation}
            />
          </motion.section>
        ) : null}

        {activeTab === "messages" ? (
          <motion.section
            key="host-messages"
            className="space-y-8"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={motionTokens.reveal(16)}
          >
            <MessagesOverviewStrip
              conversations={conversations}
              unreadCount={messagesUnreadCount}
              loading={conversationsLoading}
              error={conversationsError}
              refetchConversations={() => void refetchConversations()}
              onOpenInbox={(conversationId) => navigate(conversationId ? `/messages/${conversationId}` : "/messages")}
            />
          </motion.section>
        ) : null}

        {activeTab === "income" ? (
          <motion.section
            key="host-income"
            className="space-y-8"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={motionTokens.reveal(16)}
          >
            <div className="grid gap-6 md:grid-cols-3">
              <MetricCard
                label="Ước tính tháng này"
                value={estimatedMonthlyIncome > 0 ? formatMillions(estimatedMonthlyIncome) : "0"}
              />
              <MetricCard label="Lượt xem" value={roomStats.totalViews.toString()} />
              <MetricCard label="Lượt lưu" value={roomStats.totalFavorites.toString()} valueClassName="text-primary" />
            </div>

            <IncomeOverviewStrip
              activeRooms={activeRooms}
              pendingBookings={pendingBookings}
              currentMonthCompleted={currentMonthCompleted}
              trustScore={trustScore}
              estimatedMonthlyIncome={estimatedMonthlyIncome}
            />

            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-2xl font-extrabold tracking-[-0.03em]">
                    Thu nhập dự kiến theo tin đang hiển thị
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6">
                    Hiện thẻ thu nhập này đang ước tính theo sức chứa doanh thu của các tin đang hoạt động.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incomeRows.length === 0 ? (
                    <EmptyStateCard
                      title="Chưa có tin đang hiển thị"
                      body="Khi có tin đang hiển thị, bảng này sẽ cho bạn thấy nhóm tin đang đóng góp doanh thu dự kiến."
                    />
                  ) : (
                    incomeRows.map((room) => (
                      <div key={room.id} className="flex items-center gap-4 rounded-[1.5rem] bg-surface-container p-4">
                        <img src={getRoomCover(room)} alt={room.title} className="h-20 w-24 rounded-[1rem] object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-on-surface">{room.title}</p>
                          <p className="mt-1 truncate text-sm text-on-surface-variant">{room.address}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge className="rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-lowest">
                              {room.view_count || 0} lượt xem
                            </Badge>
                            <Badge className="rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-lowest">
                              {room.favorite_count || 0} lượt lưu
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-2xl font-bold text-primary">
                            {Number(room.price_per_month || 0) > 0 ? formatMillions(Number(room.price_per_month)) : "0"}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">/ tháng</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-xl font-extrabold tracking-[-0.03em]">
                    Nhịp vận hành
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6">
                    Tóm tắt những tín hiệu đang ảnh hưởng trực tiếp tới thu nhập và tốc độ chốt khách.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <KpiRow label="Tin đang hiển thị" value={`${activeRooms.length} tin`} />
                  <KpiRow label="Khách đang chờ" value={`${pendingBookings.length} yêu cầu`} />
                  <KpiRow label="Lịch đã hoàn thành tháng này" value={`${currentMonthCompleted} buổi`} />
                  <KpiRow label="Điểm tin cậy" value={`${trustScore}/10`} />
                  <Button className="mt-2 w-full rounded-full" onClick={() => setDashboardTab("listings")}>
                    Tối ưu tin đăng
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        ) : null}
        </AnimatePresence>
      </motion.div>

      <Dialog open={Boolean(actionType)} onOpenChange={closeActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "confirm" ? "Xác nhận lịch hẹn" : null}
              {actionType === "reject" ? "Từ chối lịch hẹn" : null}
              {actionType === "complete" ? "Hoàn thành lịch hẹn" : null}
            </DialogTitle>
            <DialogDescription>
              {actionType === "confirm"
                ? "Xác nhận rằng bạn sẽ gặp khách đúng thời gian đã chọn."
                : null}
              {actionType === "reject"
                ? "Hãy cho khách biết lý do bạn không thể nhận lịch hẹn này."
                : null}
              {actionType === "complete"
                ? "Đánh dấu rằng buổi xem phòng đã diễn ra xong."
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={actionNotes}
              onChange={(event) => setActionNotes(event.target.value)}
              className="min-h-[110px] rounded-[1.25rem]"
              placeholder={
                actionType === "reject"
                  ? "Lý do từ chối..."
                  : actionType === "complete"
                    ? "Ghi chú sau buổi xem..."
                    : "Ghi chú cho khách..."
              }
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeActionDialog} disabled={isProcessing} className="rounded-full">
              Hủy
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              className={cn(
                "rounded-full",
                actionType === "reject" && "bg-destructive text-white hover:bg-destructive/90",
                actionType === "confirm" && "bg-success text-white hover:bg-success/90",
              )}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {actionType === "confirm" ? "Xác nhận" : null}
              {actionType === "reject" ? "Từ chối" : null}
              {actionType === "complete" ? "Hoàn thành" : null}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  badge,
  badgeTone = "good",
  icon,
  valueClassName,
}: {
  label: string;
  value: string;
  badge?: string;
  badgeTone?: "good" | "warn";
  icon?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-on-surface-variant">{label}</span>
          <div className="flex items-end justify-between gap-4">
            <span className={cn("font-display text-4xl font-extrabold tracking-[-0.04em] text-on-surface", valueClassName)}>
              {value}
            </span>
            {badge ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                  badgeTone === "good"
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-secondary-container text-on-secondary-container",
                )}
              >
                {badge}
              </span>
            ) : icon ? (
              <span className="rounded-full bg-surface-container-low p-2">{icon}</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStateCard({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-surface-container-low p-6">
      <p className="font-semibold text-on-surface">{title}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{body}</p>
      {actionLabel && onAction ? (
        <Button variant="outline" className="mt-4 rounded-full" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function EmptyCardCopy({ icon, body }: { icon: ReactNode; body: string }) {
  return (
    <Card className="rounded-[2rem] border-dashed bg-transparent shadow-none">
      <CardContent className="py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">{icon}</div>
        <p className="text-sm text-on-surface-variant">{body}</p>
      </CardContent>
    </Card>
  );
}

function ListingsInsightStrip({
  hostName,
  managedRooms,
  pendingRooms,
  activeRooms,
  totalViews,
  totalFavorites,
  qualitySignals,
  onCreateListing,
  onGoIncome,
  onOpenListing,
  onEditListing,
}: {
  hostName: string;
  managedRooms: RoomWithDetails[];
  pendingRooms: RoomWithDetails[];
  activeRooms: RoomWithDetails[];
  totalViews: number;
  totalFavorites: number;
  qualitySignals: Array<{ tone: "good" | "warn"; title: string; detail: string }>;
  onCreateListing: () => void;
  onGoIncome: () => void;
  onOpenListing: (roomId: string) => void;
  onEditListing: (roomId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "rejected">("all");

  const filteredRooms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return [...managedRooms]
      .filter((room) => {
        if (statusFilter === "all") {
          return true;
        }
        return room.status === statusFilter;
      })
      .filter((room) => {
        if (!normalizedQuery) {
          return true;
        }

        return [room.title, room.address, room.city]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => {
        const leftSignal = Number(left.favorite_count || 0) + Number(left.view_count || 0) / 10;
        const rightSignal = Number(right.favorite_count || 0) + Number(right.view_count || 0) / 10;
        return rightSignal - leftSignal;
      });
  }, [managedRooms, searchQuery, statusFilter]);

  const contentReadyCount = useMemo(
    () =>
      managedRooms.filter(
        (room) => (room.images?.length || 0) >= 3 && !!room.description && room.description.trim().length >= 80,
      ).length,
    [managedRooms],
  );
  const contentHealth = managedRooms.length > 0 ? Math.round((contentReadyCount / managedRooms.length) * 100) : 0;
  const averageLivePrice =
    activeRooms.length > 0
      ? Math.round(activeRooms.reduce((total, room) => total + Number(room.price_per_month || 0), 0) / activeRooms.length)
      : 0;
  const topNeighborhood =
    activeRooms[0]?.district || activeRooms[0]?.city || pendingRooms[0]?.district || pendingRooms[0]?.city || "Khu vực của bạn";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_repeat(2,minmax(220px,0.55fr))]">
          <Card className="rounded-[2rem] border-none bg-gradient-to-br from-primary to-primary/70 text-white shadow-soft-lg">
            <CardContent className="p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Quản lý tin</p>
              <h3 className="mt-4 font-display text-[2rem] font-black tracking-[-0.05em] text-white">
                Xin chào, {hostName}!
              </h3>
              <p className="mt-3 max-w-[44ch] text-sm leading-7 text-white/82">
                Danh mục tin đang hoạt động càng rõ và nhất quán, lịch hẹn của bạn càng dễ vào nhịp hơn trong tuần này.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="rounded-full bg-white text-primary hover:bg-white/90" onClick={onCreateListing}>
                  Đăng phòng mới
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                  onClick={onGoIncome}
                >
                  Nhịp thu nhập
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Tin đang hiển thị</p>
                <p className="mt-4 font-display text-5xl font-black tracking-[-0.05em] text-on-surface">{activeRooms.length}</p>
              </div>
              <div className="mt-5">
                <div className="h-1.5 rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-tertiary"
                    style={{ width: `${Math.max(18, managedRooms.length > 0 ? (activeRooms.length / managedRooms.length) * 100 : 18)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                  {pendingRooms.length > 0
                    ? `${pendingRooms.length} tin đang chờ duyệt và cần giữ lực nội dung.`
                    : "Toàn bộ tin hiện nghiêng về nhóm đang hiển thị."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Tổng lượt xem tháng này</p>
                <p className="mt-4 font-display text-4xl font-black tracking-[-0.05em] text-on-surface">{totalViews}</p>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[...activeRooms, ...pendingRooms].slice(0, 3).map((room) => (
                    <img
                      key={room.id}
                      src={getRoomCover(room)}
                      alt={room.title}
                      className="h-9 w-9 rounded-full border-2 border-surface-container-lowest object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm leading-6 text-on-surface-variant">
                  {totalFavorites} lượt lưu đang nuôi lực chuyển đổi của các tin tốt nhất.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-xl flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm theo tên tin hoặc khu vực..."
                  className="h-12 rounded-full border-none bg-surface-container pl-11 shadow-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "active", label: "Đang hiển thị" },
                  { value: "pending", label: "Chờ duyệt" },
                  { value: "rejected", label: "Cần sửa" },
                ].map((filterItem) => (
                  <Button
                    key={filterItem.value}
                    type="button"
                    variant={statusFilter === filterItem.value ? "default" : "outline"}
                    className={cn(
                      "rounded-full px-4",
                      statusFilter === filterItem.value
                        ? "bg-primary text-white hover:bg-primary/95"
                        : "border-border bg-surface-container hover:bg-surface-container-low",
                    )}
                    onClick={() => setStatusFilter(filterItem.value as typeof statusFilter)}
                  >
                    {filterItem.label}
                  </Button>
                ))}
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <EmptyCardCopy
                icon={<Home className="h-8 w-8 text-muted-foreground/40" />}
                body="Chưa có tin nào khớp với bộ lọc hiện tại. Hãy đăng thêm tin mới hoặc nới điều kiện tìm kiếm."
              />
            ) : (
              <div className="space-y-4">
                {filteredRooms.map((room) => {
                  const statusLabel = statusChipLabel(room.status);
                  const isPending = room.status === "pending";
                  const isRejected = room.status === "rejected";

                  return (
                    <Card key={room.id} className="rounded-[1.75rem] border-none bg-surface shadow-none">
                      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                        <button
                          type="button"
                          className="relative h-28 w-full overflow-hidden rounded-[1.35rem] bg-surface-container md:w-40"
                          onClick={() => onOpenListing(room.id)}
                        >
                          <img src={getRoomCover(room)} alt={room.title} className="h-full w-full object-cover" />
                          <span className={cn("absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold", statusChipTone(room.status))}>
                            {statusLabel}
                          </span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                                {isPending ? "Chờ duyệt" : isRejected ? "Cần chỉnh sửa" : "Đang hiển thị"}
                              </p>
                              <button
                                type="button"
                                className="mt-2 truncate text-left font-display text-2xl font-black tracking-[-0.04em] text-on-surface"
                                onClick={() => onOpenListing(room.id)}
                              >
                                {room.title}
                              </button>
                              <p className="mt-2 truncate text-sm uppercase tracking-[0.18em] text-on-surface-variant">
                                {room.address}
                              </p>
                            </div>
                            <div className="shrink-0 text-left lg:text-right">
                              <p className="font-display text-3xl font-black tracking-[-0.04em] text-primary">
                                {Number(room.price_per_month || 0) > 0 ? formatMillions(Number(room.price_per_month)) : "0"}
                              </p>
                              <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">/ tháng</p>
                            </div>
                          </div>

                          <p className="mt-4 line-clamp-2 text-sm leading-7 text-on-surface-variant">
                            {room.description || "Bổ sung mô tả rõ hơn để khách nắm nhanh ưu điểm vị trí, nội thất và nhịp vào ở."}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge className="rounded-full bg-surface-container text-on-surface hover:bg-surface-container">
                              {room.view_count || 0} lượt xem
                            </Badge>
                            <Badge className="rounded-full bg-surface-container text-on-surface hover:bg-surface-container">
                              {room.favorite_count || 0} lượt lưu
                            </Badge>
                            <Badge className="rounded-full bg-surface-container text-on-surface hover:bg-surface-container">
                              {(room.images?.length || 0)} ảnh
                            </Badge>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <Button className="rounded-full px-5" onClick={() => onOpenListing(room.id)}>
                              Chi tiết
                            </Button>
                            <Button variant="outline" className="rounded-full px-5" onClick={() => onEditListing(room.id)}>
                              {isRejected ? "Sửa và gửi lại" : "Chỉnh sửa"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-xl font-extrabold tracking-[-0.03em]">Chất lượng nội dung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-on-surface">Mức độ hoàn thiện</p>
                <span className="text-sm font-semibold text-primary">{contentHealth}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(contentHealth, managedRooms.length > 0 ? 18 : 0)}%` }} />
              </div>
            </div>

            <div className="space-y-4">
              {qualitySignals.map((signal) => (
                <div key={signal.title} className="rounded-[1.25rem] bg-surface-container p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full",
                        signal.tone === "good" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {signal.tone === "good" ? <CheckCircle className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{signal.title}</p>
                      <p className="mt-1 text-sm leading-6 text-on-surface-variant">{signal.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full rounded-full" onClick={onGoIncome}>
              Tối ưu hoá tiếp
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none bg-secondary-container/30 shadow-soft-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
              <Filter className="h-4 w-4" />
              Thị trường gần bạn
            </div>
            <p className="mt-4 font-display text-2xl font-black tracking-[-0.04em] text-on-surface">{topNeighborhood}</p>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              Khu vực này đang có nhịp quan tâm tốt. Giữ ảnh cover mạnh và giá rõ ràng để đẩy tỷ lệ hỏi lịch.
            </p>
            <div className="mt-5 rounded-[1.25rem] bg-surface-container-lowest p-4">
              <KpiRow
                label="Giá hiển thị trung bình"
                value={averageLivePrice > 0 ? `${formatMillions(averageLivePrice)}/tháng` : "Đang cập nhật"}
              />
              <div className="mt-3" />
              <KpiRow label="Tổng lượt lưu" value={`${totalFavorites}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppointmentsOverviewStrip({
  bookings,
  pendingBookings,
  confirmedBookings,
  historyBookings,
  onConfirm,
  onReject,
  onComplete,
  onMessageGuest,
}: {
  bookings: BookingWithDetails[];
  pendingBookings: BookingWithDetails[];
  confirmedBookings: BookingWithDetails[];
  historyBookings: BookingWithDetails[];
  onConfirm: (booking: BookingWithDetails) => void;
  onReject: (booking: BookingWithDetails) => void;
  onComplete: (booking: BookingWithDetails) => void;
  onMessageGuest: (booking: BookingWithDetails) => void;
}) {
  const focusBookingDate = useMemo(() => {
    const candidate = [...pendingBookings, ...confirmedBookings, ...bookings]
      .map((booking) => booking.booking_date)
      .find(Boolean);

    if (!candidate) {
      return null;
    }

    try {
      return startOfDay(parseISO(candidate));
    } catch {
      return null;
    }
  }, [bookings, confirmedBookings, pendingBookings]);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(focusBookingDate ?? new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(focusBookingDate ?? new Date()));
  const [calendarTouched, setCalendarTouched] = useState(false);

  useEffect(() => {
    if (!focusBookingDate || calendarTouched) {
      return;
    }

    setVisibleMonth(startOfMonth(focusBookingDate));
    setSelectedDate(startOfDay(focusBookingDate));
  }, [calendarTouched, focusBookingDate]);

  const focusBookingDay = useCallback((bookingDate: string | null | undefined) => {
    if (!bookingDate) {
      return;
    }

    try {
      const nextDate = startOfDay(parseISO(bookingDate));
      setCalendarTouched(true);
      setVisibleMonth(startOfMonth(nextDate));
      setSelectedDate(nextDate);
    } catch {
      return;
    }
  }, []);

  const shiftMonth = useCallback((direction: "prev" | "next") => {
    setCalendarTouched(true);
    const nextMonth = direction === "next" ? addMonths(visibleMonth, 1) : subMonths(visibleMonth, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(startOfMonth(nextMonth));
  }, [visibleMonth]);

  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(monthStart);
  const gridDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { locale: vi }),
    end: endOfWeek(monthEnd, { locale: vi }),
  });

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((booking) => {
      if (!booking.booking_date) {
        return;
      }
      try {
        const key = format(parseISO(booking.booking_date), "yyyy-MM-dd");
        map.set(key, (map.get(key) ?? 0) + 1);
      } catch {
        return;
      }
    });
    return map;
  }, [bookings]);

  const agenda = useMemo(
    () =>
      bookings
        .filter((booking) => {
          if (!booking.booking_date) {
            return false;
          }

          try {
            return isSameDay(parseISO(booking.booking_date), selectedDate);
          } catch {
            return false;
          }
        })
        .sort((left, right) => {
          if (!left.booking_date || !right.booking_date) {
            return 0;
          }
          return new Date(left.booking_date).getTime() - new Date(right.booking_date).getTime();
        }),
    [bookings, selectedDate],
  );
  const requestLane = useMemo(
    () => [...pendingBookings, ...confirmedBookings].slice(0, 6),
    [confirmedBookings, pendingBookings],
  );
  const selectedDateLabel = format(selectedDate, "EEEE, dd MMMM", { locale: vi });
  const todayCount = useMemo(
    () =>
      bookings.filter((booking) => {
        if (!booking.booking_date) {
          return false;
        }
        try {
          return isSameDay(parseISO(booking.booking_date), new Date());
        } catch {
          return false;
        }
      }).length,
    [bookings],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Hôm nay" value={`${todayCount} buổi`} />
        <MetricCard label="Chờ xác nhận" value={`${pendingBookings.length} buổi`} valueClassName="text-secondary" />
        <MetricCard label="Đã xác nhận" value={`${confirmedBookings.length} buổi`} valueClassName="text-tertiary" />
        <MetricCard label="Hoàn tất" value={`${historyBookings.length} buổi`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="font-display text-2xl font-extrabold tracking-[-0.03em]">
                Danh sách yêu cầu
              </CardTitle>
              <CardDescription className="mt-2 text-sm leading-6">
                Gom các ca cần phản hồi trước, rồi tới lịch đã chốt để bạn xử lý theo đúng nhịp vận hành.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setCalendarTouched(false)}>
              Xem tất cả
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {requestLane.length === 0 ? (
              <EmptyCardCopy
                icon={<CalendarCheck className="h-8 w-8 text-muted-foreground/40" />}
                body="Chưa có yêu cầu nào trong khung lịch hẹn của bạn."
              />
            ) : (
              requestLane.map((booking) => {
                const isPending = booking.status === "pending";
                const accentClass = isPending
                  ? "before:bg-secondary"
                  : booking.status === "confirmed"
                    ? "before:bg-tertiary"
                    : "before:bg-outline";
                const bookingSelected = !!booking.booking_date &&
                  (() => {
                    try {
                      return isSameDay(parseISO(booking.booking_date), selectedDate);
                    } catch {
                      return false;
                    }
                  })();

                return (
                  <Card
                    key={booking.id}
                    className={cn(
                      "relative overflow-hidden rounded-[1.75rem] border-none bg-surface shadow-none before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1",
                      accentClass,
                      bookingSelected && "ring-2 ring-primary/20",
                    )}
                  >
                    <CardContent className="space-y-4 p-5 pl-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-primary/10 text-sm font-semibold text-primary">
                            {getBookingGuestName(booking).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-on-surface">{getBookingGuestName(booking)}</p>
                            <p className="mt-1 truncate text-sm text-on-surface-variant">
                              {booking.room?.title || "Phòng đang được hỏi"}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                              <button
                                type="button"
                                className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface transition-colors hover:bg-primary/8"
                                onClick={() => focusBookingDay(booking.booking_date)}
                              >
                                {formatBookingMoment(booking.booking_date)}
                              </button>
                              {booking.room?.district || booking.room?.city ? (
                                <span>{booking.room?.district || booking.room?.city}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-left lg:text-right">
                          <Badge
                            className={cn(
                              "rounded-full",
                              isPending
                                ? "bg-secondary-container text-on-secondary-container hover:bg-secondary-container"
                                : "bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container",
                            )}
                          >
                            {isPending ? "Pending" : booking.status === "confirmed" ? "Confirmed" : "Closed"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {isPending ? (
                          <>
                            <Button className="rounded-full px-5" onClick={() => onConfirm(booking)}>
                              Xác nhận
                            </Button>
                            <Button variant="outline" className="rounded-full px-5" onClick={() => onMessageGuest(booking)}>
                              Nhắn khách
                            </Button>
                            <Button
                              variant="ghost"
                              className="rounded-full px-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => onReject(booking)}
                            >
                              Từ chối
                            </Button>
                          </>
                        ) : booking.status === "confirmed" ? (
                          <>
                            <Button className="rounded-full px-5" onClick={() => onComplete(booking)}>
                              Hoàn tất
                            </Button>
                            <Button variant="outline" className="rounded-full px-5" onClick={() => onMessageGuest(booking)}>
                              Nhắn khách
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" className="rounded-full px-5" onClick={() => onMessageGuest(booking)}>
                            Mở trao đổi
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-display text-lg font-extrabold tracking-[-0.03em]">
                  {format(monthStart, "MMMM yyyy", { locale: vi })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => shiftMonth("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => shiftMonth("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Ngày đang xem</p>
                <p className="mt-2 font-display text-xl font-black tracking-[-0.03em] text-on-surface capitalize">
                  {selectedDateLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {agenda.length > 0
                    ? `${agenda.length} lịch đang cần theo dõi trong ngày này.`
                    : "Chưa có lịch nào được gắn vào ngày đang chọn."}
                </p>
              </div>
              <div className="grid grid-cols-7 gap-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-3">
                {gridDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const count = bookingsByDay.get(key) ?? 0;
                  const inMonth = isSameMonth(day, monthStart);
                  const isSelectedDay = isSameDay(day, selectedDate);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        setCalendarTouched(true);
                        setSelectedDate(startOfDay(day));
                        if (!isSameMonth(day, visibleMonth)) {
                          setVisibleMonth(startOfMonth(day));
                        }
                      }}
                      className={cn(
                        "min-h-[76px] rounded-[1.25rem] border px-2.5 py-2.5 text-left transition-colors",
                        inMonth ? "border-border bg-surface-container" : "border-transparent bg-transparent text-outline",
                        count > 0 && inMonth && "border-primary/20 bg-primary/5",
                        isToday(day) && "border-primary bg-primary/10",
                        isSelectedDay && "border-primary bg-primary text-white",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isSelectedDay ? "text-white" : inMonth ? "text-on-surface" : "text-outline",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {count > 0 && inMonth ? (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                              isSelectedDay ? "bg-white/20 text-white" : "bg-primary text-white",
                            )}
                          >
                            {count}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg font-extrabold tracking-[-0.03em]">
                {`Lịch ngày ${format(selectedDate, "dd/MM", { locale: vi })}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agenda.length === 0 ? (
                <p className="text-sm leading-6 text-on-surface-variant">
                  Chưa có lịch nào trong ngày đang chọn. Bạn có thể đổi tháng hoặc bấm sang ngày khác để xem lại.
                </p>
              ) : (
                agenda.map((booking) => (
                  <div key={booking.id} className="rounded-[1.25rem] bg-surface-container p-4">
                    <p className="font-semibold text-on-surface">{getBookingGuestName(booking)}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {booking.room?.title || "Phòng chưa xác định"}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                      {formatBookingMoment(booking.booking_date)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" size="sm" className="rounded-full px-4" onClick={() => onMessageGuest(booking)}>
                        Nhắn khách
                      </Button>
                      {booking.status === "pending" ? (
                        <Button type="button" size="sm" variant="outline" className="rounded-full px-4" onClick={() => onConfirm(booking)}>
                          Xác nhận
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MessagesOverviewStrip({
  conversations,
  unreadCount,
  loading,
  error,
  refetchConversations,
  onOpenInbox,
}: {
  conversations: Conversation[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetchConversations: () => void;
  onOpenInbox: (conversationId?: string) => void;
}) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
  const [sendingInline, setSendingInline] = useState(false);

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }

    if (!selectedConversationId || !conversations.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      [conversation.participant.full_name, conversation.roomTitle, conversation.participant.email]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [conversations, searchQuery]);

  const selectedConversation =
    filteredConversations.find((conversation) => conversation.id === selectedConversationId) ??
    filteredConversations[0] ??
    null;
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    markAsRead,
    connectionStatus,
  } = useConversationMessages(selectedConversation?.id ?? "");
  const previewMessages = useMemo(() => messages, [messages]);
  const previewLastMessageId = previewMessages[previewMessages.length - 1]?.id;
  const previewMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedConversation?.unreadCount) {
      void markAsRead();
    }
  }, [markAsRead, selectedConversation?.id, selectedConversation?.unreadCount]);

  useEffect(() => {
    setDraftMessage("");
  }, [selectedConversation?.id]);

  useEffect(() => {
    previewMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [previewLastMessageId, selectedConversation?.id]);

  const handleSendInline = useCallback(async () => {
    if (!selectedConversation || !draftMessage.trim() || sendingInline) {
      return;
    }

    try {
      setSendingInline(true);
      await sendMessage(draftMessage.trim());
      setDraftMessage("");
      await refetchConversations();
    } catch (sendError) {
      console.error("[MessagesOverviewStrip] Inline send error:", sendError);
      toast.error("Chưa gửi được tin nhắn. Hãy thử lại.");
    } finally {
      setSendingInline(false);
    }
  }, [draftMessage, refetchConversations, selectedConversation, sendMessage, sendingInline]);

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_300px] xl:items-start">
      <Card className="overflow-hidden rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg xl:sticky xl:top-28">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-xl font-extrabold tracking-[-0.03em]">Tin nhắn</CardTitle>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {unreadCount} mới
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm tên khách hoặc phòng..."
              className="h-11 rounded-full border-none bg-surface-container pl-11 shadow-none"
            />
          </div>
          <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1 xl:max-h-[calc(100svh-24rem)]">
            {loading ? (
              <p className="text-sm text-on-surface-variant">Đang tải hộp thư...</p>
            ) : error ? (
              <EmptyStateCard title="Không tải được hộp thư" body={error} actionLabel="Thử lại" onAction={refetchConversations} />
            ) : filteredConversations.length === 0 ? (
              <p className="text-sm leading-6 text-on-surface-variant">
                Chưa có cuộc trò chuyện nào. Khi khách hỏi về một tin phòng, khung này sẽ hiện lên ngay.
              </p>
            ) : (
              filteredConversations.slice(0, 8).map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[1.25rem] p-3 text-left transition-colors",
                    selectedConversation?.id === conversation.id
                      ? "bg-primary/8"
                      : "bg-surface-container hover:bg-surface-container-low",
                  )}
                >
                  <PremiumAvatar
                    isPremium={conversation.participant.is_premium ?? false}
                    className="h-11 w-11 border border-border/70"
                  >
                    <AvatarImage src={conversation.participant.avatar_url || undefined} />
                    <AvatarFallback>
                      {conversation.participant.full_name?.slice(0, 2).toUpperCase() || "CH"}
                    </AvatarFallback>
                  </PremiumAvatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-on-surface">{conversation.participant.full_name}</p>
                    <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-primary">
                      {conversation.roomTitle || "Chưa gắn phòng"}
                    </p>
                    <p className="mt-1 truncate text-sm text-on-surface-variant">
                      {conversation.lastMessage?.content || "Chưa có tin nhắn mới"}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              Khung xem nhanh hội thoại
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-6">
              Mỗi cuộc trò chuyện giờ gắn với đúng tin phòng khách đang hỏi để bạn không bị lẫn giữa nhiều phòng.
            </CardDescription>
          </div>
          <Button className="rounded-full px-5" onClick={() => onOpenInbox(selectedConversation?.id)}>
            Mở hộp thư đầy đủ
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col">
          {selectedConversation ? (
            <div className="flex flex-col rounded-[1.75rem] bg-surface-container p-6">
                <div className="flex items-center gap-4">
                  <PremiumAvatar
                    isPremium={selectedConversation.participant.is_premium ?? false}
                    className="h-16 w-16 border border-border/70"
                  >
                    <AvatarImage src={selectedConversation.participant.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedConversation.participant.full_name?.slice(0, 2).toUpperCase() || "CH"}
                    </AvatarFallback>
                  </PremiumAvatar>
                  <div className="min-w-0">
                    <p className="font-display text-2xl font-black tracking-[-0.03em] text-on-surface">
                      {selectedConversation.participant.full_name}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant [overflow-wrap:anywhere] break-all">
                      {selectedConversation.participant.email || "Khách đang trao đổi qua RommZ"}
                    </p>
                    {selectedConversation.roomTitle ? (
                      <Badge className="mt-3 rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                        {selectedConversation.roomTitle}
                      </Badge>
                    ) : null}
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                      {connectionStatus === "connected" ? "Đồng bộ trực tiếp" : "Đang kết nối lại"}
                    </p>
                  </div>
                </div>
                <div className="mt-6 min-h-[13rem] max-h-[22rem] space-y-3 overflow-y-auto pr-1 xl:min-h-[16rem] xl:max-h-[24rem]">
                  {messagesLoading ? (
                    <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
                      Đang tải đoạn chat gần nhất...
                    </div>
                  ) : messagesError ? (
                    <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 text-sm text-destructive">
                      {messagesError}
                    </div>
                  ) : previewMessages.length === 0 ? (
                    <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
                      Cuộc trò chuyện này chưa có tin nhắn mới.
                    </div>
                  ) : (
                    previewMessages.map((message) => {
                      const isMine = message.sender_id !== selectedConversation.participant.id;
                      return (
                        <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[78%] rounded-[1.35rem] px-4 py-3 text-sm leading-7 [overflow-wrap:anywhere]",
                              isMine
                                ? "rounded-br-md bg-primary text-white"
                                : "rounded-bl-md bg-surface-container-lowest text-on-surface",
                            )}
                          >
                            {message.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={previewMessagesEndRef} />
                </div>
                <div className="mt-6 rounded-[1.5rem] bg-surface-container-lowest p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Trả lời ngay tại đây</p>
                      <span className="text-xs text-on-surface-variant">Cuộc trò chuyện theo tin phòng đang chọn</span>
                    </div>
                    <Popover open={isQuickRepliesOpen} onOpenChange={setIsQuickRepliesOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 rounded-full px-3 text-xs font-semibold text-on-surface-variant"
                        >
                          {isQuickRepliesOpen ? "Ẩn phản hồi nhanh" : "Hiện phản hồi nhanh"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        side="top"
                        className="w-[min(24rem,calc(100vw-3rem))] rounded-[1.5rem] border-border/70 p-3"
                      >
                        <div className="mb-2">
                          <p className="text-sm font-semibold text-on-surface">Phản hồi nhanh</p>
                          <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                            Gợi ý này mở nổi trên composer để giữ nguyên vùng đọc chat của host.
                          </p>
                        </div>
                        <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
                          {[
                            "Phòng này vẫn còn trống, bạn muốn chốt lịch xem vào khung nào?",
                            "Mình đã nhận được quan tâm của bạn cho tin phòng này và sẽ phản hồi chi tiết ngay.",
                            "Nếu cần đổi lịch xem phòng, cứ nhắn lại ngay tại đây để mình cập nhật.",
                          ].map((reply) => (
                            <button
                              key={reply}
                              type="button"
                              className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-primary/8 hover:text-on-surface"
                              onClick={() => {
                                setDraftMessage(reply);
                                setIsQuickRepliesOpen(false);
                              }}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Nhắn trực tiếp cho khách ngay trong tab này..."
                    className="mt-3 min-h-[104px] rounded-[1.25rem] border-none bg-white/80 shadow-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-on-surface-variant">
                      Gợi ý trả lời mở dạng popover để không làm co hẹp vùng đọc hội thoại.
                    </span>
                    <Button
                      type="button"
                      className="rounded-full px-5"
                      disabled={!draftMessage.trim() || sendingInline}
                      onClick={() => void handleSendInline()}
                    >
                      {sendingInline ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Gửi ngay
                    </Button>
                  </div>
                </div>
            </div>
          ) : (
            <EmptyStateCard title="Chưa có hội thoại để tập trung" body="Khi có khách nhắn tin, khung xem nhanh sẽ hiện ở đây." />
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg xl:sticky xl:top-28">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-xl font-extrabold tracking-[-0.03em]">Thông tin quan tâm</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[34rem] overflow-y-auto xl:max-h-[calc(100svh-24rem)]">
          {selectedConversation ? (
            <div className="space-y-4">
              {selectedConversation.room ? (
                <>
                  <div className="overflow-hidden rounded-[1.5rem] bg-surface-container">
                    <img
                      src={selectedConversation.room.imageUrl || stitchAssets.roomDetail.gallery[0]}
                      alt={selectedConversation.room.title}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                  <div className="rounded-[1.5rem] bg-surface-container p-4">
                    <p className="font-semibold text-on-surface">{selectedConversation.room.title}</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      {selectedConversation.room.address || "Khách đang trao đổi về tin phòng này."}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-sm text-on-surface-variant">Giá tham chiếu</span>
                      <span className="font-semibold text-primary">
                        {selectedConversation.room.pricePerMonth
                          ? `${formatMillions(selectedConversation.room.pricePerMonth)}/tháng`
                          : "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] bg-surface-container p-4 text-sm leading-6 text-on-surface-variant">
                  Cuộc trò chuyện này chưa xác định rõ khách đang hỏi phòng nào. RommZ sẽ cố gắng gắn đúng tin phòng ngay từ lúc khách bấm liên hệ.
                </div>
              )}

              <div className="rounded-[1.5rem] bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Phản hồi nhanh</p>
                <div className="mt-4 space-y-2">
                  {[
                    "Phòng vẫn còn trống, mình có thể gửi thêm ảnh hoặc chốt lịch xem ngay.",
                    "Bạn đang hỏi đúng tin phòng này, mình sẽ xác nhận khung giờ phù hợp ngay tại đây.",
                    "Nếu cần đổi lịch xem phòng, cứ nhắn ngay tại đây để mình cập nhật.",
                  ].map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      className="w-full rounded-[1rem] bg-surface-container-lowest px-3 py-2 text-left text-sm leading-6 text-on-surface-variant transition-colors hover:bg-primary/6 hover:text-on-surface"
                      onClick={() => setDraftMessage(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyStateCard title="Chưa xác định phòng được hỏi" body="Chọn một hội thoại để xem khách đang quan tâm tới phòng nào." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function IncomeOverviewStrip({
  activeRooms,
  pendingBookings,
  currentMonthCompleted,
  trustScore,
  estimatedMonthlyIncome,
}: {
  activeRooms: RoomWithDetails[];
  pendingBookings: BookingWithDetails[];
  currentMonthCompleted: number;
  trustScore: string;
  estimatedMonthlyIncome: number;
}) {
  const averageTicket = activeRooms.length > 0 ? estimatedMonthlyIncome / activeRooms.length : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-2xl font-extrabold tracking-[-0.03em]">
            Tín hiệu kéo doanh thu
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">
            Trước khi đào sâu báo cáo thu nhập, hãy nhìn xem nhịp tin đăng và lịch hẹn đang đẩy hay đang ghìm sức chứa doanh thu.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-surface-container p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Giá hiển thị trung bình</p>
            <p className="mt-3 font-display text-3xl font-black tracking-[-0.04em] text-on-surface">
              {averageTicket > 0 ? formatMillions(averageTicket) : "0"}
            </p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Bình quân theo các tin đang hiển thị trong tháng này.</p>
          </div>
          <div className="rounded-[1.5rem] bg-surface-container p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Pipeline lịch hẹn</p>
            <p className="mt-3 font-display text-3xl font-black tracking-[-0.04em] text-primary">
              {pendingBookings.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Các khách đang chờ phản hồi sẽ quyết định nhịp lấp đầy tiếp theo.</p>
          </div>
          <div className="rounded-[1.5rem] bg-surface-container p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Đà hoàn tất</p>
            <p className="mt-3 font-display text-3xl font-black tracking-[-0.04em] text-tertiary">
              {currentMonthCompleted}
            </p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Số buổi xem đã hoàn tất trong tháng đang tạo tín hiệu tin cậy cho host.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-none bg-primary text-white shadow-soft-lg">
        <CardContent className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Điểm sức khoẻ</p>
          <p className="mt-3 font-display text-4xl font-black tracking-[-0.04em] text-white">{trustScore}/10</p>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Khi điểm tin cậy, số tin đang hiển thị và lịch hẹn đi cùng nhau, phần thu nhập sẽ ổn định hơn mà không cần tăng giá gấp.
          </p>
          <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4 text-sm leading-6 text-white/85">
            Tập trung giữ tin đăng đủ ảnh, phản hồi khách sớm và chốt các lịch đang treo để đà thu nhập không bị hụt.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-surface-container p-4">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="font-semibold text-on-surface">{value}</span>
    </div>
  );
}

