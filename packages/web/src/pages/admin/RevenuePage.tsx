import { useState, useEffect } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import {
  DollarSign,
  CreditCard,
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  getPaymentOrders,
  getManualReviews,
  getRevenueStats,
  resolveManualReview,
} from "@/services/admin-payments";
import type { PaymentOrder, ManualReview, RevenueStats } from "@/services/admin-payments";
import { useAuth } from "@/contexts/AuthContext";

export default function RevenuePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [reviews, setReviews] = useState<ManualReview[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"orders" | "reviews">("orders");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, reviewsData, statsData] = await Promise.all([
        getPaymentOrders({ status: filter }),
        getManualReviews({ status: "pending" }),
        getRevenueStats(),
      ]);
      setOrders(ordersData);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleResolve = async (
    reviewId: string,
    resolution: "resolved_premium" | "resolved_refund" | "dismissed"
  ) => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }
    try {
      await resolveManualReview(reviewId, resolution, user.id);
      await fetchData(); // Refresh
    } catch (error) {
      console.error("Error resolving review:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      paid: { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: <Clock className="w-4 h-4" /> },
      expired: { bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-4 h-4" /> },
      manual_review: { bg: "bg-orange-100", text: "text-orange-800", icon: <AlertCircle className="w-4 h-4" /> },
      cancelled: { bg: "bg-gray-100", text: "text-gray-800", icon: <XCircle className="w-4 h-4" /> },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status}
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý doanh thu</h1>
          <p className="text-gray-600 mt-1">Theo dõi doanh thu và các giao dịch Premium</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          title="Đơn chờ xử lý"
          value={String(stats?.pendingOrders || 0)}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Đơn cần review"
          value={String(stats?.manualReviewOrders || 0)}
          icon={AlertCircle}
          variant="info"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <CreditCard className="w-4 h-4 inline-block mr-2" />
            Tất cả đơn hàng
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "reviews"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <AlertCircle className="w-4 h-4 inline-block mr-2" />
            Review thủ công
            {reviews.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {reviews.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Filter */}
      {activeTab === "orders" && (
        <div className="flex gap-2">
          {["all", "paid", "pending", "expired", "manual_review"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === status
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {status === "all" ? "Tất cả" : status}
            </button>
          ))}
        </div>
      )}

      {/* Orders Table */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gói</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{order.order_code}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{order.user_name || "Unknown"}</div>
                    <div className="text-gray-500 text-xs">{order.user_email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium">{order.plan}</span>
                    <span className="text-gray-500 text-xs ml-1">({order.billing_cycle})</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.amount)}</td>
                  <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Reviews */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg border shadow-sm p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{review.user_name || "Unknown User"}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-500">{review.user_email}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Lý do:</strong> {review.reason}
                  </div>
                  {review.transaction_id && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Transaction ID:</strong>{" "}
                      <span className="font-mono text-xs">{review.transaction_id}</span>
                    </div>
                  )}
                  {review.amount && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Số tiền:</strong> {formatCurrency(review.amount)}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Ngày gửi: {formatDate(review.created_at)}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleResolve(review.id, "resolved_premium")}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Cấp Premium
                  </button>
                  <button
                    onClick={() => handleResolve(review.id, "dismissed")}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không có review thủ công nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}
