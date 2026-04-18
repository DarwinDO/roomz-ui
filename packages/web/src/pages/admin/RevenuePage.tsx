import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { StatsCard } from "@/components/admin/StatsCard";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  getManualReviews,
  getPaymentOrders,
  getRevenueStats,
  resolveManualReview,
  setPaymentOrderRevenueExclusion,
} from "@/services/admin-payments";
import type { ManualReview, PaymentOrder, RevenueStats } from "@/services/admin-payments";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_BADGES: Record<string, { bg: string; text: string; icon: ReactNode; label: string }> = {
  paid: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Đã thanh toán",
  },
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    icon: <Clock className="h-4 w-4" />,
    label: "Chờ thanh toán",
  },
  expired: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <XCircle className="h-4 w-4" />,
    label: "Hết hạn",
  },
  manual_review: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    icon: <AlertCircle className="h-4 w-4" />,
    label: "Cần kiểm tra",
  },
  cancelled: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: <XCircle className="h-4 w-4" />,
    label: "Đã hủy",
  },
};

const ORDER_FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "expired", label: "Hết hạn" },
  { value: "manual_review", label: "Cần kiểm tra" },
  { value: "cancelled", label: "Đã hủy" },
] as const;

export default function RevenuePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [reviews, setReviews] = useState<ManualReview[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"orders" | "reviews">("orders");
  const [actingOrderId, setActingOrderId] = useState<string | null>(null);

  const fetchData = useCallback(async (statusFilter: string) => {
    setLoading(true);

    try {
      const [ordersData, reviewsData, statsData] = await Promise.all([
        getPaymentOrders({ status: statusFilter }),
        getManualReviews({ status: "pending" }),
        getRevenueStats(),
      ]);

      setOrders(ordersData);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast.error("Không tải được dữ liệu doanh thu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(filter);
  }, [fetchData, filter]);

  const handleResolve = async (
    reviewId: string,
    resolution: "resolved_premium" | "resolved_refund" | "dismissed"
  ) => {
    if (!user?.id) {
      console.error("User not authenticated");
      toast.error("Bạn cần đăng nhập lại với quyền quản trị.");
      return;
    }

    try {
      await resolveManualReview(reviewId, resolution, user.id);
      toast.success("Đã cập nhật kết quả review.");
      await fetchData(filter);
    } catch (error) {
      console.error("Error resolving review:", error);
      toast.error("Không cập nhật được review.");
    }
  };

  const handleToggleRevenueExclusion = async (order: PaymentOrder) => {
    if (order.status !== "paid") {
      return;
    }

    const exclude = !order.exclude_from_revenue;
    const confirmed = window.confirm(
      exclude
        ? `Loại giao dịch ${order.order_code} khỏi doanh thu?`
        : `Tính lại giao dịch ${order.order_code} vào doanh thu?`
    );

    if (!confirmed) {
      return;
    }

    setActingOrderId(order.id);

    try {
      await setPaymentOrderRevenueExclusion(order.id, exclude);
      toast.success(
        exclude
          ? "Giao dịch đã được loại khỏi doanh thu."
          : "Giao dịch đã được tính lại vào doanh thu."
      );
      await fetchData(filter);
    } catch (error) {
      console.error("Error updating revenue exclusion:", error);
      toast.error("Không cập nhật được trạng thái doanh thu.");
    } finally {
      setActingOrderId(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusBadge = (status: string) => {
    const badge = STATUS_BADGES[status] || STATUS_BADGES.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getRevenueBadge = (order: PaymentOrder) => {
    if (order.status !== "paid") {
      return <span className="text-xs text-gray-400">-</span>;
    }

    if (order.exclude_from_revenue) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          <Ban className="h-3.5 w-3.5" />
          Đã loại
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle className="h-3.5 w-3.5" />
        Đang tính
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý doanh thu</h1>
          <p className="mt-1 text-gray-600">Theo dõi doanh thu và các giao dịch Premium</p>
        </div>
        <button
          onClick={() => void fetchData(filter)}
          className="rounded-lg p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          title="Làm mới dữ liệu"
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng doanh thu"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title="Đơn đã thanh toán"
          value={String(stats?.paidOrders || 0)}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Đơn chờ thanh toán"
          value={String(stats?.pendingOrders || 0)}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Đơn cần kiểm tra"
          value={String(stats?.manualReviewOrders || 0)}
          icon={AlertCircle}
          variant="info"
        />
      </div>

      {stats && stats.excludedPaidOrders > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Đã loại khỏi doanh thu {formatCurrency(stats.excludedRevenue)} từ {stats.excludedPaidOrders} giao dịch đã thanh toán.
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-1 py-4 text-sm font-medium ${
              activeTab === "orders"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CreditCard className="mr-2 inline-block h-4 w-4" />
            Tất cả đơn hàng
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-1 py-4 text-sm font-medium ${
              activeTab === "reviews"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <AlertCircle className="mr-2 inline-block h-4 w-4" />
            Review thủ công
            {reviews.length > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                {reviews.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === "orders" && (
        <div className="flex flex-wrap gap-2">
          {ORDER_FILTERS.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilter(status.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === status.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Mã đơn</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Gói</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Số tiền</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Doanh thu</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{order.order_code}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{order.user_name || "Unknown"}</div>
                    <div className="text-xs text-gray-500">{order.user_email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium">{order.plan}</span>
                    <span className="ml-1 text-xs text-gray-500">({order.billing_cycle})</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.amount)}</td>
                  <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3">{getRevenueBadge(order)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3">
                    {order.status === "paid" ? (
                      <button
                        onClick={() => void handleToggleRevenueExclusion(order)}
                        disabled={actingOrderId === order.id || loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actingOrderId === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : order.exclude_from_revenue ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        {order.exclude_from_revenue ? "Tính lại doanh thu" : "Loại khỏi doanh thu"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium">{review.user_name || "Unknown User"}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-500">{review.user_email}</span>
                  </div>
                  <div className="mb-2 text-sm text-gray-600">
                    <strong>Lý do:</strong> {review.reason}
                  </div>
                  {review.transaction_id && (
                    <div className="mb-2 text-sm text-gray-600">
                      <strong>Transaction ID:</strong>{" "}
                      <span className="font-mono text-xs">{review.transaction_id}</span>
                    </div>
                  )}
                  {review.amount && (
                    <div className="mb-2 text-sm text-gray-600">
                      <strong>Số tiền:</strong> {formatCurrency(review.amount)}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">Ngày gửi: {formatDate(review.created_at)}</div>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => void handleResolve(review.id, "resolved_premium")}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                  >
                    Cấp Premium
                  </button>
                  <button
                    onClick={() => void handleResolve(review.id, "dismissed")}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="py-8 text-center text-gray-500">Không có review thủ công nào</div>
          )}
        </div>
      )}
    </div>
  );
}
