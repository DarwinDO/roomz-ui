import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flag, AlertTriangle, CheckCircle, Eye, Ban, Trash2 } from "lucide-react";
import { mockReports, type Report } from "@/data/adminData";
import { toast } from "sonner";

export default function ReportsPage() {
  const [filter, setFilter] = useState("all");
  const [reports, setReports] = useState(mockReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportedName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filter === "all" ? true :
      filter === "pending" ? report.status === "pending" :
      filter === "investigating" ? report.status === "investigating" :
      filter === "resolved" ? report.status === "resolved" : true;
    
    return matchesSearch && matchesFilter;
  });

  const handleInvestigate = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, status: "investigating" } : r
    ));
    toast.success("Đã bắt đầu điều tra");
  };

  const handleResolve = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, status: "resolved" } : r
    ));
    setSelectedReport(null);
    toast.success("Đã giải quyết báo cáo");
  };

  const handleDismiss = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, status: "dismissed" } : r
    ));
    setSelectedReport(null);
    toast.success("Đã bỏ qua báo cáo");
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case "spam": return "Spam";
      case "fraud": return "Lừa đảo";
      case "inappropriate": return "Không phù hợp";
      case "other": return "Khác";
      default: return type;
    }
  };

  const columns = [
    {
      key: "reporter",
      label: "Người báo cáo",
      render: (item: Report) => (
        <span className="font-medium">{item.reporterName}</span>
      ),
    },
    {
      key: "reported",
      label: "Bị báo cáo",
      render: (item: Report) => (
        <div>
          <div className="font-medium">{item.reportedName}</div>
          <Badge variant="outline" className="text-xs mt-1">
            {item.reportedType === "user" ? "Người dùng" : "Phòng"}
          </Badge>
        </div>
      ),
    },
    {
      key: "type",
      label: "Loại vi phạm",
      render: (item: Report) => (
        <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
      ),
    },
    {
      key: "priority",
      label: "Ưu tiên",
      render: (item: Report) => (
        <Badge 
          className={
            item.priority === "high" ? "bg-red-100 text-red-700" :
            item.priority === "medium" ? "bg-orange-100 text-orange-700" :
            "bg-blue-100 text-blue-700"
          }
        >
          {item.priority === "high" ? "Cao" : 
           item.priority === "medium" ? "Trung bình" : "Thấp"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: Report) => (
        <Badge 
          className={
            item.status === "pending" ? "bg-yellow-100 text-yellow-700" :
            item.status === "investigating" ? "bg-blue-100 text-blue-700" :
            item.status === "resolved" ? "bg-green-100 text-green-700" :
            "bg-gray-100 text-gray-700"
          }
        >
          {item.status === "pending" ? "Chờ xử lý" : 
           item.status === "investigating" ? "Đang điều tra" : 
           item.status === "resolved" ? "Đã giải quyết" : "Đã bỏ qua"}
        </Badge>
      ),
    },
    {
      key: "date",
      label: "Ngày báo cáo",
      render: (item: Report) => (
        <span className="text-gray-600 text-sm">
          {new Date(item.date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (item: Report) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setSelectedReport(item)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {item.status === "pending" && (
            <Button 
              size="sm"
              onClick={() => handleInvestigate(item.id)}
            >
              Điều tra
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Khiếu nại</h1>
        <p className="text-gray-600 mt-1">Quản lý các báo cáo vi phạm từ người dùng</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="investigating">Đang điều tra</SelectItem>
            <SelectItem value="resolved">Đã giải quyết</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredReports}
        columns={columns}
        searchPlaceholder="Tìm theo tên..."
        onSearch={setSearchTerm}
        pageSize={15}
      />

      {/* Report Detail Modal */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết báo cáo</DialogTitle>
              <DialogDescription>
                Báo cáo ID: {selectedReport.id} | Ngày: {new Date(selectedReport.date).toLocaleDateString('vi-VN')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Người báo cáo</p>
                  <p className="text-sm">{selectedReport.reporterName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Bị báo cáo</p>
                  <p className="text-sm">{selectedReport.reportedName}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {selectedReport.reportedType === "user" ? "Người dùng" : "Phòng"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Loại vi phạm</p>
                  <p className="text-sm">{getTypeLabel(selectedReport.type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Mức độ ưu tiên</p>
                  <Badge 
                    className={
                      selectedReport.priority === "high" ? "bg-red-100 text-red-700" :
                      selectedReport.priority === "medium" ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }
                  >
                    {selectedReport.priority === "high" ? "Cao" : 
                     selectedReport.priority === "medium" ? "Trung bình" : "Thấp"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Mô tả</p>
                <Textarea
                  value={selectedReport.description}
                  readOnly
                  className="min-h-[100px]"
                />
              </div>

              {(selectedReport.status === "pending" || selectedReport.status === "investigating") && (
                <div className="flex gap-3 justify-end pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => handleDismiss(selectedReport.id)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Bỏ qua
                  </Button>
                  <Button 
                    onClick={() => handleResolve(selectedReport.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Đánh dấu đã giải quyết
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


