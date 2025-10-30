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
import { Home, CheckCircle, Clock, Star, MoreVertical, Eye, Check, X, Trash2 } from "lucide-react";
import { mockRooms, type AdminRoom } from "@/data/adminData";
import { toast } from "sonner";

export default function RoomsPage() {
  const [filter, setFilter] = useState("all");
  const [rooms, setRooms] = useState(mockRooms);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filter === "all" ? true :
      filter === "active" ? room.status === "active" :
      filter === "pending" ? room.status === "pending" :
      filter === "featured" ? room.featured : true;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: rooms.length,
    active: rooms.filter(r => r.status === "active").length,
    pending: rooms.filter(r => r.status === "pending").length,
    featured: rooms.filter(r => r.featured).length,
  };

  const handleApprove = (roomId: string) => {
    setRooms(rooms.map(r => 
      r.id === roomId ? { ...r, status: "active", verified: true } : r
    ));
    toast.success("Đã phê duyệt phòng");
  };

  const handleReject = (roomId: string) => {
    setRooms(rooms.map(r => 
      r.id === roomId ? { ...r, status: "rejected" } : r
    ));
    toast.success("Đã từ chối phòng");
  };

  const handleToggleFeatured = (roomId: string) => {
    setRooms(rooms.map(r => 
      r.id === roomId ? { ...r, featured: !r.featured } : r
    ));
    toast.success("Đã cập nhật trạng thái nổi bật");
  };

  const handleDelete = (roomId: string) => {
    setRooms(rooms.filter(r => r.id !== roomId));
    toast.success("Đã xóa phòng");
  };

  const columns = [
    {
      key: "room",
      label: "Phòng",
      render: (room: AdminRoom) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <ImageWithFallback
              src={room.thumbnail}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-medium">{room.title}</div>
            <div className="text-sm text-gray-500">{room.location}</div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Giá",
      render: (room: AdminRoom) => (
        <span className="font-medium">{(room.price / 1000000).toFixed(1)}tr/tháng</span>
      ),
    },
    {
      key: "owner",
      label: "Chủ nhà",
      render: (room: AdminRoom) => (
        <span className="text-gray-600">{room.owner}</span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (room: AdminRoom) => (
        <div className="flex items-center gap-2">
          <Badge 
            variant={room.status === "active" ? "default" : "secondary"}
            className={
              room.status === "active" ? "bg-green-100 text-green-700" :
              room.status === "pending" ? "bg-yellow-100 text-yellow-700" :
              room.status === "rejected" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            }
          >
            {room.status === "active" ? "Hoạt động" : 
             room.status === "pending" ? "Chờ duyệt" : 
             room.status === "rejected" ? "Từ chối" : "Đã gỡ"}
          </Badge>
          {room.featured && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      ),
    },
    {
      key: "verified",
      label: "Xác thực",
      render: (room: AdminRoom) => (
        room.verified ? (
          <CheckCircle className="w-5 h-5 text-blue-600" />
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      ),
    },
    {
      key: "postedDate",
      label: "Ngày đăng",
      render: (room: AdminRoom) => (
        <span className="text-gray-600 text-sm">
          {new Date(room.postedDate).toLocaleDateString('vi-VN')}
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
            <DropdownMenuItem>
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
            <DropdownMenuItem onClick={() => handleToggleFeatured(room.id)}>
              <Star className="h-4 w-4 mr-2" />
              {room.featured ? "Bỏ nổi bật" : "Làm nổi bật"}
            </DropdownMenuItem>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng trọ</h1>
        <p className="text-gray-600 mt-1">Quản lý tất cả tin đăng phòng trong hệ thống</p>
      </div>

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
          title="Tin nổi bật"
          value={stats.featured}
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
            <SelectItem value="featured">Tin nổi bật</SelectItem>
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


