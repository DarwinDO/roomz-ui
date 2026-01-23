import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, CheckCircle, Clock, Star, MoreVertical, Eye, Check, X, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useAdminRooms } from "@/hooks/useAdmin";
import type { AdminRoom } from "@/services/admin";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function RoomsPage() {
  const navigate = useNavigate();
  const { rooms, loading, error, stats, approveRoom, rejectRoom, deleteRoom, refetch } = useAdminRooms();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.district?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ? true :
        filter === "active" ? room.status === "active" :
          filter === "pending" ? room.status === "pending" :
            filter === "verified" ? room.is_verified : true;

    return matchesSearch && matchesFilter;
  });

  const handleApprove = async (roomId: string) => {
    try {
      await approveRoom(roomId);
      toast.success("Đã phê duyệt phòng");
    } catch {
      toast.error("Không thể phê duyệt phòng");
    }
  };

  const handleReject = async (roomId: string) => {
    try {
      await rejectRoom(roomId);
      toast.success("Đã từ chối phòng");
    } catch {
      toast.error("Không thể từ chối phòng");
    }
  };

  const handleDelete = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      toast.success("Đã xóa phòng");
    } catch {
      toast.error("Không thể xóa phòng");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Hoạt động</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Chờ duyệt</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-700">Từ chối</Badge>;
      case "rented":
        return <Badge className="bg-blue-100 text-blue-700">Đã thuê</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Nháp</Badge>;
    }
  };

  const columns = [
    {
      key: "room",
      label: "Phòng",
      render: (room: AdminRoom) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <ImageWithFallback
              src={room.images?.[0]?.image_url || ""}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-medium">{room.title}</div>
            <div className="text-sm text-gray-500">{room.district}, {room.city}</div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Giá",
      render: (room: AdminRoom) => (
        <span className="font-medium">
          {room.price_per_month ? `${(Number(room.price_per_month) / 1000000).toFixed(1)}tr/tháng` : "-"}
        </span>
      ),
    },
    {
      key: "owner",
      label: "Chủ nhà",
      render: (room: AdminRoom) => (
        <div>
          <span className="text-gray-600">{room.landlord?.full_name || "N/A"}</span>
          <div className="text-xs text-gray-400">{room.landlord?.email}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (room: AdminRoom) => (
        <div className="flex items-center gap-2">
          {getStatusBadge(room.status)}
          {room.is_verified && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      ),
    },
    {
      key: "stats",
      label: "Thống kê",
      render: (room: AdminRoom) => (
        <div className="text-sm text-gray-500">
          <div>{room.view_count || 0} lượt xem</div>
          <div>{room.favorite_count || 0} yêu thích</div>
        </div>
      ),
    },
    {
      key: "postedDate",
      label: "Ngày đăng",
      render: (room: AdminRoom) => (
        <span className="text-gray-600 text-sm">
          {room.created_at ? new Date(room.created_at).toLocaleDateString('vi-VN') : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (room: AdminRoom) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/room/${room.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Xem chi tiết
            </DropdownMenuItem>
            {room.status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => handleApprove(room.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Phê duyệt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReject(room.id)}>
                  <X className="h-4 w-4 mr-2" />
                  Từ chối
                </DropdownMenuItem>
              </>
            )}
            {room.status === "inactive" && (
              <DropdownMenuItem onClick={() => handleApprove(room.id)}>
                <Check className="h-4 w-4 mr-2" />
                Kích hoạt lại
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(room.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng trọ</h1>
        <p className="text-gray-600 mt-1">Quản lý tất cả tin đăng phòng trong hệ thống</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
            Thử lại
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng phòng"
          value={stats.total}
          icon={Home}
          variant="default"
        />
        <StatsCard
          title="Đang hoạt động"
          value={stats.active}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Chờ phê duyệt"
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="Đã xác thực"
          value={stats.verified}
          icon={Star}
          variant="info"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="pending">Chờ phê duyệt</SelectItem>
            <SelectItem value="verified">Đã xác thực</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredRooms}
        columns={columns}
        searchPlaceholder="Tìm theo tiêu đề hoặc địa điểm..."
        onSearch={setSearchTerm}
        pageSize={15}
      />
    </div>
  );
}
