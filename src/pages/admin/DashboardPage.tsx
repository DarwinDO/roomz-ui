import { StatsCard } from "@/components/admin/StatsCard";
import { LineChartComponent, BarChartComponent, PieChartComponent } from "@/components/admin/Charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Home, DollarSign, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminStats } from "@/hooks/useAdmin";
import { useUserGrowthStats, useRoomTypeDistribution } from "@/hooks/useAdminAnalytics";

export default function DashboardPage() {
  const { data: stats, isLoading: loading } = useAdminStats();
  const { data: userGrowth = [] } = useUserGrowthStats();
  const { data: roomDistribution = [] } = useRoomTypeDistribution();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600 mt-1">Chào mừng trở lại! Đây là tổng quan hệ thống RoomZ.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Tổng người dùng"
              value={stats?.totalUsers || 0}
              icon={Users}
              variant="default"
            />
            <StatsCard
              title="Phòng đang hoạt động"
              value={stats?.activeRooms || 0}
              icon={Home}
              variant="success"
            />
            <StatsCard
              title="Chờ phê duyệt"
              value={stats?.pendingRooms || 0}
              icon={ShieldCheck}
              variant="warning"
            />
            <StatsCard
              title="Tổng lịch hẹn"
              value={stats?.totalBookings || 0}
              icon={DollarSign}
              variant="info"
            />
          </>
        )}
      </div>

      {/* Charts - Placeholder if no real data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartComponent
          title="Tăng trưởng người dùng"
          data={userGrowth.length > 0 ? userGrowth : []}
          dataKey="users"
          xAxisKey="month"
        />
        {/* Placeholder for Revenue Chart */}
        <Card className="p-6 flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Dữ liệu doanh thu đang được thu thập...</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PieChartComponent
            title="Phân bố loại phòng"
            data={roomDistribution}
            dataKey="value"
            nameKey="type"
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-6 border-none shadow-soft rounded-2xl h-full">
          <h3 className="text-lg font-bold mb-6 text-gray-900">Thao tác nhanh</h3>
          <div className="space-y-4">
            <Link to="/admin/rooms">
              <Button variant="outline" className="w-full justify-between mb-3 h-12 rounded-xl hover:border-primary/50 hover:text-primary transition-colors hover:bg-primary/5 bg-white shadow-sm">
                <span className="font-medium">Quản lý phòng</span>
                {stats?.pendingRooms ? (
                  <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                    {stats.pendingRooms} chờ duyệt
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-between mb-3 h-12 rounded-xl hover:border-primary/50 hover:text-primary transition-colors hover:bg-primary/5 bg-white shadow-sm">
                <span className="font-medium">Quản lý người dùng</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/verifications">
              <Button variant="outline" className="w-full justify-between mb-3 h-12 rounded-xl hover:border-primary/50 hover:text-primary transition-colors hover:bg-primary/5 bg-white shadow-sm">
                <span className="font-medium">Xác thực người dùng</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="outline" className="w-full justify-between h-12 rounded-xl hover:border-primary/50 hover:text-primary transition-colors hover:bg-primary/5 bg-white shadow-sm">
                <span className="font-medium">Xem báo cáo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Summary Info */}
      <Card className="p-6 border-none shadow-soft rounded-2xl">
        <h3 className="text-lg font-bold mb-6 text-gray-900">Tóm tắt hệ thống</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-gray-100">
            <p className="text-3xl font-bold text-primary mb-2">{stats?.totalUsers || 0}</p>
            <p className="text-sm font-medium text-muted-foreground">Người dùng</p>
          </div>
          <div className="text-center p-6 bg-green-50/30 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-green-100">
            <p className="text-3xl font-bold text-green-600 mb-2">{stats?.activeRooms || 0}</p>
            <p className="text-sm font-medium text-muted-foreground">Phòng hoạt động</p>
          </div>
          <div className="text-center p-6 bg-amber-50/30 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-amber-100">
            <p className="text-3xl font-bold text-amber-600 mb-2">{stats?.pendingRooms || 0}</p>
            <p className="text-sm font-medium text-muted-foreground">Chờ duyệt</p>
          </div>
          <div className="text-center p-6 bg-blue-50/30 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-blue-100">
            <p className="text-3xl font-bold text-blue-600 mb-2">{stats?.totalBookings || 0}</p>
            <p className="text-sm font-medium text-muted-foreground">Lịch hẹn</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
