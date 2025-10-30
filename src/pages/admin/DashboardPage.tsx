import { StatsCard } from "@/components/admin/StatsCard";
import { LineChartComponent, BarChartComponent, PieChartComponent } from "@/components/admin/Charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Home, DollarSign, ShieldCheck, ArrowRight } from "lucide-react";
import { analyticsData, recentActivities } from "@/data/adminData";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600 mt-1">Chào mừng trở lại! Đây là tổng quan hệ thống RoomZ.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng người dùng"
          value="1,920"
          change={12.5}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Phòng đang hoạt động"
          value="48"
          change={8.2}
          icon={Home}
          variant="success"
        />
        <StatsCard
          title="Doanh thu tháng này"
          value="21.3tr"
          change={15.3}
          icon={DollarSign}
          variant="info"
        />
        <StatsCard
          title="Yêu cầu xác thực"
          value="8"
          change={-2.4}
          icon={ShieldCheck}
          variant="warning"
        />
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
            <Link to="/admin/verifications">
              <Button variant="outline" className="w-full justify-between">
                <span>Xác thực người dùng</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/rooms">
              <Button variant="outline" className="w-full justify-between">
                <span>Quản lý phòng</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="outline" className="w-full justify-between">
                <span>Xem báo cáo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button variant="outline" className="w-full justify-between">
                <span>Phân tích chi tiết</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Hoạt động gần đây</h3>
          <Link to="/admin/users">
            <Button variant="ghost" size="sm">
              Xem tất cả
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Người dùng</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Hoạt động</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{activity.user}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{activity.action}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{activity.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


