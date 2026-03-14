import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileWarning } from "lucide-react";
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
import { Eye, Ban, CheckCircle } from "lucide-react";
import { useAdminReports, useUpdateReportStatus } from "@/hooks/useAdminReports";
import type { Report } from "@/services/reports";

export default function ReportsPage() {
  const [filter, setFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: reports = [], isLoading } = useAdminReports({
    status: filter === "all" ? undefined : filter,
  });

  const updateStatus = useUpdateReportStatus();

  const filteredReports = reports.filter(report => {
    const reporterName = report.reporter?.full_name || "";
    const matchesSearch = reporterName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleInvestigate = (reportId: string) => {
    updateStatus.mutate({ reportId, status: "investigating" });
  };

  const handleResolve = (reportId: string) => {
    updateStatus.mutate({ reportId, status: "resolved" });
    setSelectedReport(null);
  };

  const handleDismiss = (reportId: string) => {
    updateStatus.mutate({ reportId, status: "dismissed" });
    setSelectedReport(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "spam": return "Spam";
      case "fraud": return "Lừa đảo";
      case "inappropriate": return "Không phù hợp";
      case "other": return "Khác";
      default: return type;
    }
  };

  const columns: ColumnDef<Report>[] = [
    {
      id: "reporter",
      header: "Người báo cáo",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.reporter?.full_name || "N/A"}</span>
      ),
      enableSorting: false,
    },
    {
      id: "reported",
      header: "Bị báo cáo",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.reported_name || row.original.reported_id.slice(0, 8)}</div>
          <Badge variant="outline" className="text-xs mt-1">
            {row.original.reported_type === "user" ? "Người dùng" : "Phòng"}
          </Badge>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "type",
      header: "Loại vi phạm",
      cell: ({ row }) => (
        <Badge variant="outline">{getTypeLabel(row.original.type)}</Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "priority",
      header: "Ưu tiên",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.priority === "high" ? "bg-red-100 text-red-700" :
              row.original.priority === "medium" ? "bg-orange-100 text-orange-700" :
                "bg-blue-100 text-blue-700"
          }
        >
          {row.original.priority === "high" ? "Cao" :
            row.original.priority === "medium" ? "Trung bình" : "Thấp"}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.status === "pending" ? "bg-yellow-100 text-yellow-700" :
              row.original.status === "investigating" ? "bg-blue-100 text-blue-700" :
                row.original.status === "resolved" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
          }
        >
          {row.original.status === "pending" ? "Chờ xử lý" :
            row.original.status === "investigating" ? "Đang điều tra" :
              row.original.status === "resolved" ? "Đã giải quyết" : "Đã bỏ qua"}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "created_at",
      header: "Ngày báo cáo",
      cell: ({ row }) => (
        <span className="text-gray-600 text-sm">
          {new Date(row.original.created_at).toLocaleDateString('vi-VN')}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedReport(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {item.status === "pending" && (
              <Button size="sm" onClick={() => handleInvestigate(item.id)}>
                Điều tra
              </Button>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  // Empty state when no reports
  if (!isLoading && reports.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Khiếu nại</h1>
          <p className="text-gray-600 mt-1">Quản lý các báo cáo vi phạm từ người dùng</p>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FileWarning className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có báo cáo nào
            </h3>
            <p className="text-gray-500">
              Hệ thống hiện chưa có báo cáo vi phạm nào.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Khiếu nại</h1>
        <p className="text-gray-600 mt-1">Quản lý các báo cáo vi phạm từ người dùng</p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Filters */}
      {!isLoading && (
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
      )}

      {/* Data Table */}
      {!isLoading && (
        <DataTable
          data={filteredReports}
          columns={columns}
          searchPlaceholder="Tìm theo tên..."
          onSearch={setSearchTerm}
          pageSize={15}
        />
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết báo cáo</DialogTitle>
              <DialogDescription>
                Báo cáo ID: {selectedReport.id} | Ngày: {new Date(selectedReport.created_at).toLocaleDateString('vi-VN')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Người báo cáo</p>
                  <p className="text-sm">{selectedReport.reporter?.full_name || "N/A"}</p>
                  <p className="text-xs text-gray-500">{selectedReport.reporter?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Bị báo cáo</p>
                  <p className="text-sm">{selectedReport.reported_name || selectedReport.reported_id.slice(0, 8)}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {selectedReport.reported_type === "user" ? "Người dùng" : "Phòng"}
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
                  value={selectedReport.description || "Không có mô tả"}
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
