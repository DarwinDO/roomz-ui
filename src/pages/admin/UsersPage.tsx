import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Users, UserCheck, UserX, MoreVertical, Eye, Ban, Trash2, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdmin";
import type { AdminUser } from "@/services/admin";
import { toast } from "sonner";

export default function UsersPage() {
  const { users, loading, error, stats, suspendUser, activateUser, deleteUser, refetch } = useAdminUsers();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ? true :
        filter === "active" ? user.account_status === "active" :
          filter === "suspended" ? user.account_status === "suspended" :
            filter === "landlord" ? user.role === "landlord" :
              filter === "admin" ? user.role === "admin" : true;

    return matchesSearch && matchesFilter;
  });

  const handleSuspend = async (userId: string) => {
    try {
      await suspendUser(userId);
      toast.success("Đã đình chỉ người dùng");
    } catch {
      toast.error("Không thể đình chỉ người dùng");
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await activateUser(userId);
      toast.success("Đã kích hoạt người dùng");
    } catch {
      toast.error("Không thể kích hoạt người dùng");
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast.success("Đã xóa người dùng");
    } catch {
      toast.error("Không thể xóa người dùng");
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-700">Quản trị</Badge>;
      case "landlord":
        return <Badge className="bg-blue-100 text-blue-700">Chủ nhà</Badge>;
      default:
        return <Badge variant="outline">Sinh viên</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Hoạt động</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Đình chỉ</Badge>;
      case "pending_verification":
        return <Badge className="bg-yellow-100 text-yellow-700">Chờ xác thực</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Không xác định</Badge>;
    }
  };

  const columns = [
    {
      key: "user",
      label: "Người dùng",
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.full_name || "Chưa cập nhật"}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Vai trò",
      render: (user: AdminUser) => getRoleBadge(user.role),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (user: AdminUser) => getStatusBadge(user.account_status),
    },
    {
      key: "info",
      label: "Thông tin",
      render: (user: AdminUser) => (
        <div className="text-sm text-gray-500">
          {user.university && <div>{user.university}</div>}
          {user.phone && <div>{user.phone}</div>}
        </div>
      ),
    },
    {
      key: "joinDate",
      label: "Ngày tham gia",
      render: (user: AdminUser) => (
        <span className="text-gray-600">
          {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : "-"}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: "Đăng nhập cuối",
      render: (user: AdminUser) => (
        <span className="text-gray-600 text-sm">
          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('vi-VN') : "Chưa đăng nhập"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (user: AdminUser) => (
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
            {user.account_status === "suspended" ? (
              <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Kích hoạt
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                <Ban className="h-4 w-4 mr-2" />
                Đình chỉ
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(user.id)}
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
        <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-gray-600 mt-1">Quản lý tất cả người dùng trong hệ thống</p>
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
          title="Tổng người dùng"
          value={stats.total}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Đang hoạt động"
          value={stats.active}
          icon={UserCheck}
          variant="success"
        />
        <StatsCard
          title="Đã đình chỉ"
          value={stats.suspended}
          icon={UserX}
          variant="warning"
        />
        <StatsCard
          title="Chủ nhà"
          value={users.filter(u => u.role === "landlord").length}
          icon={CheckCircle}
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
            <SelectItem value="suspended">Đã đình chỉ</SelectItem>
            <SelectItem value="landlord">Chủ nhà</SelectItem>
            <SelectItem value="admin">Quản trị viên</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Tìm theo tên hoặc email..."
        onSearch={setSearchTerm}
        pageSize={15}
      />
    </div>
  );
}
