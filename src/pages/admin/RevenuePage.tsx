import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, Wallet, Loader2 } from "lucide-react";
import { getAdminStats } from "@/services/admin";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function RevenuePage() {
  const handleExport = () => {
    toast.info("Tính năng xuất báo cáo đang phát triển");
  };

  // Get basic stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý doanh thu</h1>
          <p className="text-gray-600 mt-1">Theo dõi doanh thu và các giao dịch</p>
        </div>
        <Button onClick={handleExport}>
          <Wallet className="w-4 h-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Coming Soon State */}
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="bg-amber-50 rounded-full p-6 w-24 h-24 mx-auto mb-6">
            <DollarSign className="w-12 h-12 text-amber-600 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Chức năng đang được phát triển
          </h2>
          <p className="text-gray-500 mb-6">
            Chúng tôi đang xây dựng hệ thống quản lý doanh thu.
            Hãy quay lại sau để xem báo cáo chi tiết.
          </p>
        </div>
      </div>

      {/* Basic Stats (if available) */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tổng đặt phòng"
            value={String(stats?.totalBookings || 0)}
            icon={CreditCard}
            variant="default"
          />
          <StatsCard
            title="Tổng phòng"
            value={String(stats?.totalRooms || 0)}
            icon={DollarSign}
            variant="success"
          />
          <StatsCard
            title="Phòng hoạt động"
            value={String(stats?.activeRooms || 0)}
            icon={Wallet}
            variant="info"
          />
          <StatsCard
            title="Phòng chờ duyệt"
            value={String(stats?.pendingRooms || 0)}
            icon={Loader2}
            variant="warning"
          />
        </div>
      )}
    </div>
  );
}
