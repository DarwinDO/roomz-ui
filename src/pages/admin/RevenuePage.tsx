import { StatsCard } from "@/components/admin/StatsCard";
import { LineChartComponent, BarChartComponent } from "@/components/admin/Charts";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, CreditCard, RefreshCcw, Download } from "lucide-react";
import { mockTransactions, analyticsData, type Transaction } from "@/data/adminData";
import { toast } from "sonner";

export default function RevenuePage() {
  const handleExport = () => {
    toast.success("Đang xuất báo cáo doanh thu...");
  };

  const revenueData = [
    { month: "Tháng 5", revenue: 8500000 },
    { month: "Tháng 6", revenue: 12200000 },
    { month: "Tháng 7", revenue: 15600000 },
    { month: "Tháng 8", revenue: 18900000 },
    { month: "Tháng 9", revenue: 20100000 },
    { month: "Tháng 10", revenue: 21300000 },
  ];

  const columns = [
    {
      key: "user",
      label: "Người dùng",
      render: (item: Transaction) => (
        <span className="font-medium">{item.userName}</span>
      ),
    },
    {
      key: "type",
      label: "Loại giao dịch",
      render: (item: Transaction) => (
        <Badge variant="outline">
          {item.type === "subscription" ? "Đăng ký RoomZ+" : 
           item.type === "booking_fee" ? "Phí đặt phòng" : "Tin nổi bật"}
        </Badge>
      ),
    },
    {
      key: "amount",
      label: "Số tiền",
      render: (item: Transaction) => (
        <span className="font-medium">{(item.amount / 1000).toFixed(0)}k</span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: Transaction) => (
        <Badge 
          className={
            item.status === "completed" ? "bg-green-100 text-green-700" :
            item.status === "pending" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }
        >
          {item.status === "completed" ? "Hoàn thành" : 
           item.status === "pending" ? "Đang xử lý" : "Đã hoàn tiền"}
        </Badge>
      ),
    },
    {
      key: "date",
      label: "Ngày giao dịch",
      render: (item: Transaction) => (
        <span className="text-gray-600 text-sm">
          {new Date(item.date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý doanh thu</h1>
          <p className="text-gray-600 mt-1">Theo dõi doanh thu và các giao dịch</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng doanh thu"
          value="21.3tr"
          change={15.3}
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title="MRR"
          value="12.5tr"
          change={8.7}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="RoomZ+ Subscriptions"
          value="63"
          change={12.0}
          icon={CreditCard}
          variant="info"
        />
        <StatsCard
          title="Yêu cầu hoàn tiền"
          value="2"
          change={-25.0}
          icon={RefreshCcw}
          variant="warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartComponent
          title="Xu hướng doanh thu"
          data={revenueData}
          dataKey="revenue"
          xAxisKey="month"
        />
        <BarChartComponent
          title="Doanh thu theo nguồn"
          data={analyticsData.revenueByCategory}
          dataKey="amount"
          xAxisKey="category"
        />
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Giao dịch gần đây</h3>
        <DataTable
          data={mockTransactions.slice(0, 20)}
          columns={columns}
          searchPlaceholder="Tìm giao dịch..."
          pageSize={10}
        />
      </div>
    </div>
  );
}


