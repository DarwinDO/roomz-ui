import { StatsCard } from "@/components/admin/StatsCard";
import { LineChartComponent, BarChartComponent, PieChartComponent } from "@/components/admin/Charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Home, DollarSign, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { analyticsData } from "@/data/adminData";
import { Link } from "react-router-dom";
import { useAdminStats } from "@/hooks/useAdmin";

export default function DashboardPage() {
  const { stats, loading } = useAdminStats();

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartComponent
          title="Tăng trưởng người dùng"
          data={analyticsData.userGrowth}
          dataKey="users"
          xAxisKey="month"
        />
        <BarChartComponent
          title="Doanh thu theo danh mục"
          data={analyticsData.revenueByCategory}
          dataKey="amount"
          xAxisKey="category"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PieChartComponent
            title="Phân bố loại phòng"
            data={analyticsData.roomTypes}
            dataKey="value"
            nameKey="type"
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Thao tác nhanh</h3>
          <div className="space-y-3">
            <Link to="/admin/rooms">
              <Button variant="outline" className="w-full justify-between mb-2">
                <span>Quản lý phòng</span>
                {stats?.pendingRooms ? (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                    {stats.pendingRooms} chờ duyệt
                  </span>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-between mb-2">
                <span>Quản lý người dùng</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/verifications">
              <Button variant="outline" className="w-full justify-between mb-2">
                <span>Xác thực người dùng</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="outline" className="w-full justify-between">
                <span>Xem báo cáo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Summary Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tóm tắt hệ thống</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats?.totalUsers || 0}</p>
            <p className="text-sm text-gray-500">Người dùng</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.activeRooms || 0}</p>
            <p className="text-sm text-gray-500">Phòng hoạt động</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats?.pendingRooms || 0}</p>
            <p className="text-sm text-gray-500">Chờ duyệt</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.totalBookings || 0}</p>
            <p className="text-sm text-gray-500">Lịch hẹn</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
