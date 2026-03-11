import { useMemo, useState } from "react";
import {
  BarChart2,
  Download,
  Loader2,
  MapPinned,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { StatsCard } from "@/components/admin/StatsCard";
import { BarChartComponent, LineChartComponent } from "@/components/admin/Charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminStats } from "@/hooks/useAdmin";
import {
  useFeatureUsageStats,
  usePopularLocationStats,
  useRoomTypeDistribution,
  useUserGrowthStats,
  useUserRetentionCohorts,
} from "@/hooks/useAdminAnalytics";
import { exportToCsv } from "@/lib/exportCsv";

type LocationTab = "searched" | "viewed" | "converting";

function formatFeatureGroup(group: string) {
  switch (group) {
    case "discovery":
      return "Khám phá";
    case "engagement":
      return "Tương tác";
    case "conversion":
      return "Chuyển đổi";
    case "growth":
      return "Tăng trưởng";
    case "revenue":
      return "Doanh thu";
    default:
      return group;
  }
}

function formatLocationSource(source: string) {
  switch (source) {
    case "mapbox":
      return "Mapbox";
    case "catalog":
      return "Catalog";
    case "search":
    case "search_filters":
      return "Search";
    default:
      return source;
  }
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getHeatColor(value: number) {
  if (value >= 40) return "bg-emerald-500 text-white";
  if (value >= 25) return "bg-emerald-100 text-emerald-800";
  if (value >= 10) return "bg-amber-100 text-amber-800";
  return "bg-rose-50 text-rose-700";
}

export default function AnalyticsPage() {
  const [locationTab, setLocationTab] = useState<LocationTab>("searched");

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: userGrowth = [], isLoading: growthLoading } = useUserGrowthStats();
  const { data: roomDistribution = [], isLoading: roomDistributionLoading } = useRoomTypeDistribution();
  const {
    data: featureUsage = [],
    isLoading: featureUsageLoading,
    error: featureUsageError,
  } = useFeatureUsageStats(30);
  const {
    data: popularLocations,
    isLoading: popularLocationsLoading,
    error: popularLocationsError,
  } = usePopularLocationStats(30, 8);
  const {
    data: retentionCohorts = [],
    isLoading: retentionLoading,
    error: retentionError,
  } = useUserRetentionCohorts(6);

  const isLoading =
    statsLoading ||
    growthLoading ||
    roomDistributionLoading ||
    featureUsageLoading ||
    popularLocationsLoading ||
    retentionLoading;

  const sortedFeatureUsage = useMemo(
    () => [...featureUsage].sort((left, right) => right.total_events - left.total_events),
    [featureUsage],
  );

  const featureUsageChartData = useMemo(
    () =>
      sortedFeatureUsage.slice(0, 8).map((item) => ({
        label: item.feature_label.length > 18 ? `${item.feature_label.slice(0, 18)}…` : item.feature_label,
        events: item.total_events,
      })),
    [sortedFeatureUsage],
  );

  const totalFeatureEvents = useMemo(
    () => sortedFeatureUsage.reduce((sum, item) => sum + item.total_events, 0),
    [sortedFeatureUsage],
  );

  const totalFeatureSessions = useMemo(
    () => sortedFeatureUsage.reduce((sum, item) => sum + item.unique_sessions, 0),
    [sortedFeatureUsage],
  );

  const topFeature = sortedFeatureUsage[0] ?? null;
  const fastestGrowingFeature = useMemo(
    () =>
      [...sortedFeatureUsage]
        .filter((item) => item.change_pct > 0)
        .sort((left, right) => right.change_pct - left.change_pct)[0] ?? null,
    [sortedFeatureUsage],
  );

  const popularLocationTabItems = useMemo(() => {
    const data = popularLocations ?? { searched: [], viewed: [], converting: [] };

    switch (locationTab) {
      case "searched":
        return data.searched.map((item) => ({
          key: `${item.location_label}-${item.source}`,
          title: item.location_label,
          subtitle: [item.district, item.city].filter(Boolean).join(", "),
          primaryValue: `${item.search_events.toLocaleString("vi-VN")} lượt tìm`,
          secondaryValue: `${item.unique_users.toLocaleString("vi-VN")} người dùng`,
          badge: `${item.change_pct >= 0 ? "+" : ""}${formatPercent(item.change_pct)}`,
          meta: formatLocationSource(item.source),
        }));
      case "viewed":
        return data.viewed.map((item) => ({
          key: `${item.location_label}-viewed`,
          title: item.location_label,
          subtitle: [item.district, item.city].filter(Boolean).join(", "),
          primaryValue: `${item.room_views.toLocaleString("vi-VN")} lượt xem`,
          secondaryValue: `${item.bookings.toLocaleString("vi-VN")} booking • ${item.favorites.toLocaleString("vi-VN")} favorite`,
          badge: `${item.unique_users.toLocaleString("vi-VN")} user`,
          meta: `${item.contact_views.toLocaleString("vi-VN")} lượt xem liên hệ`,
        }));
      case "converting":
        return data.converting.map((item) => ({
          key: `${item.location_label}-converting`,
          title: item.location_label,
          subtitle: [item.district, item.city].filter(Boolean).join(", "),
          primaryValue: `${formatPercent(item.booking_rate)} booking rate`,
          secondaryValue: `${formatPercent(item.engagement_rate)} engagement`,
          badge: `${item.bookings.toLocaleString("vi-VN")} booking`,
          meta: `${item.room_views.toLocaleString("vi-VN")} lượt xem`,
        }));
      default:
        return [];
    }
  }, [locationTab, popularLocations]);

  const popularLocationChartData = useMemo(() => {
    const data = popularLocations ?? { searched: [], viewed: [], converting: [] };

    switch (locationTab) {
      case "searched":
        return data.searched.map((item) => ({ label: item.location_label, value: item.search_events }));
      case "viewed":
        return data.viewed.map((item) => ({ label: item.location_label, value: item.room_views }));
      case "converting":
        return data.converting.map((item) => ({ label: item.location_label, value: item.booking_rate }));
      default:
        return [];
    }
  }, [locationTab, popularLocations]);

  const retentionSummary = useMemo(() => {
    if (retentionCohorts.length === 0) {
      return {
        averageWeek1: 0,
        averageWeek4: 0,
        latestCohort: null as string | null,
      };
    }

    const averageWeek1 = retentionCohorts.reduce((sum, row) => sum + row.week_1_retention, 0) / retentionCohorts.length;
    const averageWeek4 = retentionCohorts.reduce((sum, row) => sum + row.week_4_retention, 0) / retentionCohorts.length;
    const latestCohort = retentionCohorts[retentionCohorts.length - 1]?.cohort_label ?? null;

    return { averageWeek1, averageWeek4, latestCohort };
  }, [retentionCohorts]);

  const retentionChartData = useMemo(
    () => retentionCohorts.map((row) => ({ cohort: row.cohort_label, week_1: row.week_1_retention, week_4: row.week_4_retention })),
    [retentionCohorts],
  );

  const handleExport = () => {
    const locationRows = (popularLocations?.searched ?? []).map((item) => ({
      loai: "Địa điểm được tìm nhiều",
      nhom: formatLocationSource(item.source),
      ten: item.location_label,
      gia_tri: item.search_events,
      nguoi_dung: item.unique_users,
      phien: item.unique_sessions,
      thay_doi_7_ngay: item.change_pct,
    }));

    const retentionRows = retentionCohorts.map((item) => ({
      loai: "Retention cohort",
      nhom: item.cohort_label,
      ten: item.cohort_month,
      gia_tri: item.cohort_size,
      week_1_retention: item.week_1_retention,
      week_2_retention: item.week_2_retention,
      week_4_retention: item.week_4_retention,
    }));

    const allData = [
      ...userGrowth.map((item) => ({
        loai: "Tăng trưởng người dùng",
        nhom: "Core",
        ten: item.month,
        gia_tri: item.users,
      })),
      ...roomDistribution.map((item) => ({
        loai: "Phân bổ loại phòng",
        nhom: "Inventory",
        ten: item.type,
        gia_tri: item.value,
      })),
      ...sortedFeatureUsage.map((item) => ({
        loai: "Sử dụng tính năng",
        nhom: formatFeatureGroup(item.feature_group),
        ten: item.feature_label,
        gia_tri: item.total_events,
        nguoi_dung: item.unique_users,
        phien: item.unique_sessions,
        thay_doi_7_ngay: item.change_pct,
      })),
      ...locationRows,
      ...retentionRows,
    ];

    if (allData.length === 0) {
      toast.info("Không có dữ liệu để xuất");
      return;
    }

    exportToCsv(allData, "roomz_analytics", {
      loai: "Loại dữ liệu",
      nhom: "Nhóm",
      ten: "Tên",
      gia_tri: "Giá trị",
      nguoi_dung: "Người dùng",
      phien: "Phiên",
      thay_doi_7_ngay: "Thay đổi 7 ngày (%)",
      week_1_retention: "Week 1 retention (%)",
      week_2_retention: "Week 2 retention (%)",
      week_4_retention: "Week 4 retention (%)",
    });
    toast.success("Đã xuất báo cáo thành công");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phân tích và thống kê</h1>
          <p className="mt-1 text-gray-600">
            Theo dõi số liệu cốt lõi, mức sử dụng tính năng, địa điểm phổ biến và cohort retention từ hệ analytics nội bộ.
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Tổng người dùng" value={String(stats?.totalUsers || 0)} icon={Users} variant="default" />
            <StatsCard title="Người dùng hoạt động" value={String(stats?.activeUsers || 0)} icon={TrendingUp} variant="success" />
            <StatsCard title="Tổng phòng" value={String(stats?.totalRooms || 0)} icon={MapPinned} variant="info" />
            <StatsCard title="Tổng đặt phòng" value={String(stats?.totalBookings || 0)} icon={BarChart2} variant="warning" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LineChartComponent title="Tăng trưởng người dùng" data={userGrowth} dataKey="users" xAxisKey="month" />
            <BarChartComponent title="Phân bổ loại phòng" data={roomDistribution} dataKey="value" xAxisKey="type" />
          </div>

          <Card className="space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Sử dụng tính năng</h2>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Dữ liệu 30 ngày gần nhất từ search, room detail, booking, roommate và các hành vi chuyển đổi chính.
                </p>
              </div>
              <Badge variant="outline" className="w-fit rounded-full">30 ngày gần nhất</Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-2xl border border-border/70 p-4 shadow-none">
                <p className="text-sm text-muted-foreground">Tổng sự kiện</p>
                <p className="mt-2 text-3xl font-semibold">{totalFeatureEvents.toLocaleString("vi-VN")}</p>
              </Card>
              <Card className="rounded-2xl border border-border/70 p-4 shadow-none">
                <p className="text-sm text-muted-foreground">Tổng phiên ghi nhận</p>
                <p className="mt-2 text-3xl font-semibold">{totalFeatureSessions.toLocaleString("vi-VN")}</p>
              </Card>
              <Card className="rounded-2xl border border-border/70 p-4 shadow-none">
                <p className="text-sm text-muted-foreground">Tính năng nổi bật nhất</p>
                <p className="mt-2 text-lg font-semibold">{topFeature?.feature_label || "Chưa có dữ liệu"}</p>
                {topFeature && <p className="mt-1 text-sm text-muted-foreground">{topFeature.total_events.toLocaleString("vi-VN")} lượt tương tác</p>}
              </Card>
              <Card className="rounded-2xl border border-border/70 p-4 shadow-none">
                <p className="text-sm text-muted-foreground">Tăng mạnh nhất 7 ngày</p>
                <p className="mt-2 text-lg font-semibold">{fastestGrowingFeature?.feature_label || "Chưa đủ dữ liệu"}</p>
                {fastestGrowingFeature && <p className="mt-1 text-sm text-emerald-600">+{fastestGrowingFeature.change_pct.toFixed(1)}%</p>}
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
              <BarChartComponent title="Top tính năng được dùng nhiều nhất" data={featureUsageChartData} dataKey="events" xAxisKey="label" />

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bảng chi tiết</h3>
                  <Badge variant="secondary" className="rounded-full">{sortedFeatureUsage.length} tính năng</Badge>
                </div>

                {featureUsageError ? (
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
                    Analytics feature usage chưa sẵn sàng trên database. Hãy deploy migration analytics trước khi dùng dashboard này.
                  </div>
                ) : sortedFeatureUsage.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    Chưa có dữ liệu feature usage. Hãy chạy thử các luồng search, xem phòng, booking hoặc roommate để bắt đầu thu thập.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedFeatureUsage.slice(0, 8).map((item) => (
                      <div key={item.event_name} className="rounded-2xl border border-border/70 p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.feature_label}</p>
                            <p className="text-sm text-muted-foreground">{formatFeatureGroup(item.feature_group)}</p>
                          </div>
                          <Badge variant={item.change_pct >= 0 ? "secondary" : "outline"} className="rounded-full">
                            {item.change_pct >= 0 ? "+" : ""}{item.change_pct.toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Tổng lượt</p>
                            <p className="font-medium">{item.total_events.toLocaleString("vi-VN")}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Người dùng</p>
                            <p className="font-medium">{item.unique_users.toLocaleString("vi-VN")}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Phiên</p>
                            <p className="font-medium">{item.unique_sessions.toLocaleString("vi-VN")}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </Card>

          <Card className="space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Địa điểm phổ biến</h2>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Tách riêng 3 góc nhìn: địa điểm được tìm nhiều, khu vực có lượt xem phòng cao và nơi đang chuyển đổi tốt nhất.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ["searched", "Được tìm nhiều"],
                  ["viewed", "Được xem nhiều"],
                  ["converting", "Chuyển đổi tốt"],
                ] as const).map(([key, label]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={locationTab === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationTab(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
              <BarChartComponent
                title={
                  locationTab === "searched"
                    ? "Top địa điểm được tìm nhiều"
                    : locationTab === "viewed"
                      ? "Top khu vực có lượt xem cao"
                      : "Top khu vực chuyển đổi tốt"
                }
                data={popularLocationChartData.map((item) => ({
                  label: item.label.length > 20 ? `${item.label.slice(0, 20)}…` : item.label,
                  value: item.value,
                }))}
                dataKey="value"
                xAxisKey="label"
              />

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Chi tiết địa điểm</h3>
                  <Badge variant="secondary" className="rounded-full">{popularLocationTabItems.length} mục</Badge>
                </div>

                {popularLocationsError ? (
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
                    Popular locations chưa sẵn sàng trên database. Hãy deploy migration analytics phase 2 trước khi dùng dashboard này.
                  </div>
                ) : popularLocationTabItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    Chưa có đủ dữ liệu location analytics. Hãy thử search theo khu vực, chọn location từ Mapbox hoặc catalog và xem thêm vài phòng.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {popularLocationTabItems.map((item) => (
                      <div key={item.key} className="rounded-2xl border border-border/70 p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
                          </div>
                          <Badge variant="outline" className="rounded-full">{item.badge}</Badge>
                        </div>
                        <p className="text-sm font-medium">{item.primaryValue}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.secondaryValue}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.meta}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </Card>

          <Card className="space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Tỷ lệ giữ chân người dùng</h2>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Cohort source lấy từ `public.users`. Active user chỉ tính từ các hành vi có ý nghĩa như search, room view, favorite, booking và roommate actions.
                </p>
              </div>
              <Badge variant="outline" className="w-fit rounded-full">6 cohort gần nhất</Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="rounded-2xl border border-border/70 p-4 shadow-none">
                <p className="text-sm text-muted-foreground">Retention tuần 1 trung bình</p>
                <p className="mt-2 text-3xl font-semibold">{formatPercent(retentionSummary.averageWeek1)}</p>
              </Card>
              <Card className="rounded-2xl border border-border/70 p-4 shadow-none">
                <p className="text-sm text-muted-foreground">Retention tuần 4 trung bình</p>
                <p className="mt-2 text-3xl font-semibold">{formatPercent(retentionSummary.averageWeek4)}</p>
              </Card>
              <Card className="rounded-2xl border border-border/70 p-4 shadow-none">
                <p className="text-sm text-muted-foreground">Cohort mới nhất</p>
                <p className="mt-2 text-3xl font-semibold">{retentionSummary.latestCohort || "Chưa có"}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
              <LineChartComponent
                title="Retention tuần 1 theo cohort"
                data={retentionChartData}
                dataKey="week_1"
                xAxisKey="cohort"
                valueFormatter={(value) => formatPercent(value)}
              />

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Cohort matrix</h3>
                  <Badge variant="secondary" className="rounded-full">{retentionCohorts.length} cohort</Badge>
                </div>

                {retentionError ? (
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
                    Retention cohort chưa sẵn sàng trên database. Hãy deploy migration analytics phase 2 trước khi dùng dashboard này.
                  </div>
                ) : retentionCohorts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    Chưa có đủ dữ liệu retention. Sau khi người dùng tạo tài khoản và sinh event thật, cohort matrix sẽ tự hiển thị.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {retentionCohorts.map((row) => (
                      <div key={row.cohort_month} className="rounded-2xl border border-border/70 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">Cohort {row.cohort_label}</p>
                            <p className="text-sm text-muted-foreground">{row.cohort_size.toLocaleString("vi-VN")} user</p>
                          </div>
                          <Badge variant="outline" className="rounded-full">{row.week_4_users.toLocaleString("vi-VN")} user quay lại tuần 4</Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className={`rounded-xl px-3 py-3 ${getHeatColor(row.week_1_retention)}`}>
                            <p className="text-xs uppercase tracking-[0.2em] opacity-80">W1</p>
                            <p className="mt-1 text-lg font-semibold">{formatPercent(row.week_1_retention)}</p>
                          </div>
                          <div className={`rounded-xl px-3 py-3 ${getHeatColor(row.week_2_retention)}`}>
                            <p className="text-xs uppercase tracking-[0.2em] opacity-80">W2</p>
                            <p className="mt-1 text-lg font-semibold">{formatPercent(row.week_2_retention)}</p>
                          </div>
                          <div className={`rounded-xl px-3 py-3 ${getHeatColor(row.week_4_retention)}`}>
                            <p className="text-xs uppercase tracking-[0.2em] opacity-80">W4</p>
                            <p className="mt-1 text-lg font-semibold">{formatPercent(row.week_4_retention)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

