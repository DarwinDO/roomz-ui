import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
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
import {
  useAdminRooms,
  useApproveRoom,
  useRejectRoom,
  useDeleteRoom,
  adminKeys,
} from "@/hooks/useAdmin";
import type { AdminRoom } from "@/services/admin";
import { useNavigate } from "react-router-dom";
import { RejectionDialog } from "@/components/admin/RejectionDialog";
import * as adminService from "@/services/admin";

export default function RoomsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query hooks
  const { data: rooms = [], isLoading, error, refetch } = useAdminRooms();

  // Mutation hooks
  const approveMutation = useApproveRoom();
  const rejectMutation = useRejectRoom();
  const deleteMutation = useDeleteRoom();

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedRoomForReject, setSelectedRoomForReject] = useState<AdminRoom | null>(null);

  // Compute stats from data
  const stats = useMemo(() => ({
    total: rooms.length,
    active: rooms.filter(r => r.status === 'active').length,
    pending: rooms.filter(r => r.status === 'pending').length,
    verified: rooms.filter(r => r.is_verified).length,
  }), [rooms]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
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
  }, [rooms, searchTerm, filter]);

  const handleApprove = async (roomId: string) => {
    await approveMutation.mutateAsync(roomId);
  };

  const openRejectDialog = (room: AdminRoom) => {
    setSelectedRoomForReject(room);
    setRejectionDialogOpen(true);
  };

  const handleRejectWithReason = async (reason: string) => {
    if (!selectedRoomForReject) return;
    await rejectMutation.mutateAsync({
      roomId: selectedRoomForReject.id,
      reason
    });
    setSelectedRoomForReject(null);
  };

  const handleDelete = async (roomId: string) => {
    await deleteMutation.mutateAsync(roomId);
  };

  // Prefetch handler
  const handlePrefetchRoom = (roomId: string) => {
    queryClient.prefetchQuery({
      queryKey: adminKeys.rooms.detail(roomId),
      queryFn: () => adminService.getAdminRooms().then(rooms => rooms.find(r => r.id === roomId)),
    });
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

  const columns: ColumnDef<AdminRoom>[] = [
    {
      accessorKey: "title",
      header: "Phòng",
      cell: ({ row }) => {
        const room = row.original;
        return (
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
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "price_per_month",
      header: "Giá",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <span className="font-medium">
            {room.price_per_month ? `${(Number(room.price_per_month) / 1000000).toFixed(1)}tr/tháng` : "-"}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      id: "owner",
      header: "Chủ nhà",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <div>
            <span className="text-gray-600">{room.landlord?.full_name || "N/A"}</span>
            <div className="text-xs text-gray-400">{room.landlord?.email}</div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <div className="flex items-center gap-2">
            {getStatusBadge(room.status)}
            {room.is_verified && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: "stats",
      header: "Thống kê",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <div className="text-sm text-gray-500">
            <div>{room.view_count || 0} lượt xem</div>
            <div>{room.favorite_count || 0} yêu thích</div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "created_at",
      header: "Ngày đăng",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <span className="text-gray-600 text-sm">
            {room.created_at ? new Date(room.created_at).toLocaleDateString('vi-VN') : "-"}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/room/${room.id}`)}
                onMouseEnter={() => handlePrefetchRoom(room.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              {room.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => handleApprove(room.id)}>
                    <Check className="h-4 w-4 mr-2" />
                    Phê duyệt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRejectDialog(room)}>
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
        );
      },
      enableSorting: false,
    },
  ];

  if (isLoading) {
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
          <p className="text-sm text-red-700">{error.message}</p>
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

      {/* Rejection Dialog */}
      <RejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        onConfirm={handleRejectWithReason}
        type="room"
        itemName={selectedRoomForReject?.title}
      />
    </div>
  );
}
