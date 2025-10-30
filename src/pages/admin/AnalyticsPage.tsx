import { StatsCard } from "@/components/admin/StatsCard";
import { LineChartComponent, BarChartComponent } from "@/components/admin/Charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Clock, BarChart2, Download } from "lucide-react";
import { analyticsData } from "@/data/adminData";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const handleExport = () => {
    toast.success("Đang xuất báo cáo...");
  };

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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="MAU (Monthly Active Users)"
          value="1,580"
          change={18.2}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Tỷ lệ chuyển đổi"
          value="3.2%"
          change={0.8}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Thời gian trung bình"
          value="12 phút"
          change={-2.1}
          icon={Clock}
          variant="info"
        />
        <StatsCard
          title="Bounce Rate"
          value="42%"
          change={-5.3}
          icon={BarChart2}
          variant="warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartComponent
          title="Người dùng hoạt động hàng tháng"
          data={analyticsData.userGrowth}
          dataKey="users"
          xAxisKey="month"
        />
        <BarChartComponent
          title="Doanh thu theo tháng"
          data={analyticsData.revenueByCategory}
          dataKey="amount"
          xAxisKey="category"
        />
      </div>

      {/* Feature Usage */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sử dụng tính năng</h3>
        <div className="space-y-4">
          {[
            { name: "Tìm kiếm phòng", usage: 85, color: "bg-primary" },
            { name: "Tìm bạn cùng phòng", usage: 68, color: "bg-secondary" },
            { name: "SwapRoom", usage: 42, color: "bg-green-500" },
            { name: "Local Passport", usage: 35, color: "bg-orange-500" },
            { name: "Dịch vụ hỗ trợ", usage: 28, color: "bg-blue-500" },
          ].map((feature, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{feature.name}</span>
                <span className="text-sm text-gray-600">{feature.usage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${feature.color} h-2 rounded-full transition-all`}
                  style={{ width: `${feature.usage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Popular Locations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Địa điểm phổ biến</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { location: "Quận 1", rooms: 12 },
            { location: "Quận 3", rooms: 8 },
            { location: "Thủ Đức", rooms: 15 },
            { location: "Bình Thạnh", rooms: 10 },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{item.rooms}</div>
              <div className="text-sm text-gray-600 mt-1">{item.location}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* User Retention */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tỷ lệ giữ chân người dùng</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tháng</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tuần 1</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tuần 2</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tuần 4</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tháng 2</th>
              </tr>
            </thead>
            <tbody>
              {[
                { month: "Tháng 10", w1: "100%", w2: "68%", w4: "52%", m2: "38%" },
                { month: "Tháng 9", w1: "100%", w2: "72%", w4: "55%", m2: "42%" },
                { month: "Tháng 8", w1: "100%", w2: "65%", w4: "48%", m2: "35%" },
              ].map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium">{row.month}</td>
                  <td className="py-3 px-4 text-sm">{row.w1}</td>
                  <td className="py-3 px-4 text-sm">{row.w2}</td>
                  <td className="py-3 px-4 text-sm">{row.w4}</td>
                  <td className="py-3 px-4 text-sm">{row.m2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


