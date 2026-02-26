import { StatsCard } from "@/components/admin/StatsCard";
import { LineChartComponent, BarChartComponent } from "@/components/admin/Charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Clock, BarChart2, Download, Loader2 } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdmin";
import { useUserGrowthStats, useRoomTypeDistribution } from "@/hooks/useAdminAnalytics";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const handleExport = () => {
    toast.info("Tính năng xuất báo cáo đang phát triển");
  };

  // Get admin stats using centralized hook
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  // Get user growth data
  const { data: userGrowth = [], isLoading: growthLoading } = useUserGrowthStats();

  // Get room type distribution
  const { data: roomDistribution = [], isLoading: distLoading } = useRoomTypeDistribution();

  const isLoading = statsLoading || growthLoading || distLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phân tích & Thống kê</h1>
          <p className="text-gray-600 mt-1">Tổng hợp dữ liệu và insights chi tiết</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Key Metrics */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tổng người dùng"
            value={String(stats?.totalUsers || 0)}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Người dùng hoạt động"
            value={String(stats?.activeUsers || 0)}
            icon={TrendingUp}
            variant="success"
          />
          <StatsCard
            title="Tổng phòng"
            value={String(stats?.totalRooms || 0)}
            icon={Clock}
            variant="info"
          />
          <StatsCard
            title="Tổng đặt phòng"
            value={String(stats?.totalBookings || 0)}
            icon={BarChart2}
            variant="warning"
          />
        </div>
      )}

      {/* Charts */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent
            title="Tăng trưởng người dùng"
            data={userGrowth}
            dataKey="users"
            xAxisKey="month"
          />
          <BarChartComponent
            title="Phân bố loại phòng"
            data={roomDistribution}
            dataKey="value"
            xAxisKey="type"
          />
        </div>
      )}

      {/* Feature Usage - Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sử dụng tính năng</h3>
        <div className="text-center py-8 text-gray-500">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Dữ liệu đang được thu thập...</p>
        </div>
      </Card>

      {/* Popular Locations - Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Địa điểm phổ biến</h3>
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Dữ liệu đang được thu thập...</p>
        </div>
      </Card>

      {/* User Retention - Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tỷ lệ giữ chân người dùng</h3>
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Dữ liệu đang được thu thập...</p>
        </div>
      </Card>
    </div>
  );
}
