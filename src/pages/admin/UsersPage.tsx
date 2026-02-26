import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
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
import { Users, UserCheck, UserX, MoreVertical, Eye, Ban, Trash2, CheckCircle, Loader2, AlertCircle, Building2, XCircle } from "lucide-react";
import {
  useAdminUsers,
  useSuspendUser,
  useActivateUser,
  useDeleteUser,
  useApproveLandlord,
  useRejectLandlord,
} from "@/hooks/useAdmin";
import type { AdminUser } from "@/services/admin";
import { toast } from "sonner";
import { RejectionDialog } from "@/components/admin/RejectionDialog";

export default function UsersPage() {
  // Query hooks
  const { data: users = [], isLoading, error, refetch } = useAdminUsers();

  // Mutation hooks
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();
  const deleteMutation = useDeleteUser();
  const approveLandlordMutation = useApproveLandlord();
  const rejectLandlordMutation = useRejectLandlord();

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedUserForReject, setSelectedUserForReject] = useState<AdminUser | null>(null);

  // Compute stats from data
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.account_status === 'active').length,
    suspended: users.filter(u => u.account_status === 'suspended').length,
    verified: users.filter(u => u.account_status === 'active').length,
    pendingLandlords: users.filter(u => u.account_status === 'pending_landlord').length,
  }), [users]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filter === "all" ? true :
          filter === "active" ? user.account_status === "active" :
            filter === "suspended" ? user.account_status === "suspended" :
              filter === "pending_landlord" ? user.account_status === "pending_landlord" :
                filter === "landlord" ? user.role === "landlord" :
                  filter === "admin" ? user.role === "admin" : true;

      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filter]);

  const handleSuspend = async (userId: string) => {
    await suspendMutation.mutateAsync(userId);
  };

  const handleActivate = async (userId: string) => {
    await activateMutation.mutateAsync(userId);
  };

  const handleDelete = async (userId: string) => {
    await deleteMutation.mutateAsync(userId);
  };

  const handleApproveLandlord = async (userId: string) => {
    await approveLandlordMutation.mutateAsync(userId);
  };

  const openRejectLandlordDialog = (user: AdminUser) => {
    setSelectedUserForReject(user);
    setRejectionDialogOpen(true);
  };

  const handleRejectLandlordWithReason = async (reason: string) => {
    if (!selectedUserForReject) return;
    await rejectLandlordMutation.mutateAsync({
      userId: selectedUserForReject.id,
      reason
    });
    setSelectedUserForReject(null);
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
      case "pending_landlord":
        return <Badge className="bg-amber-100 text-amber-700">Chờ duyệt chủ trọ</Badge>;
      case "pending_verification":
        return <Badge className="bg-yellow-100 text-yellow-700">Chờ xác thực</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Không xác định</Badge>;
    }
  };

  const columns: ColumnDef<AdminUser>[] = [
    {
      id: "user",
      header: "Người dùng",
      cell: ({ row }) => {
        const user = row.original;
        return (
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
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => getRoleBadge(row.original.role),
      enableSorting: true,
    },
    {
      accessorKey: "account_status",
      header: "Trạng thái",
      cell: ({ row }) => getStatusBadge(row.original.account_status),
      enableSorting: true,
    },
    {
      id: "info",
      header: "Thông tin",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-sm text-gray-500">
            {user.university && <div>{user.university}</div>}
            {user.phone && <div>{user.phone}</div>}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "created_at",
      header: "Ngày tham gia",
      cell: ({ row }) => (
        <span className="text-gray-600">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('vi-VN') : "-"}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "last_login_at",
      header: "Đăng nhập cuối",
      cell: ({ row }) => (
        <span className="text-gray-600 text-sm">
          {row.original.last_login_at ? new Date(row.original.last_login_at).toLocaleDateString('vi-VN') : "Chưa đăng nhập"}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.info("Tính năng đang phát triển")}>
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              {user.account_status === "pending_landlord" ? (
                <>
                  <DropdownMenuItem onClick={() => handleApproveLandlord(user.id)}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Duyệt làm chủ trọ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRejectLandlordDialog(user)}>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Từ chối đăng ký
                  </DropdownMenuItem>
                </>
              ) : user.account_status === "suspended" ? (
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
        <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-gray-600 mt-1">Quản lý tất cả người dùng trong hệ thống</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
        <StatsCard
          title="Chờ duyệt chủ trọ"
          value={stats.pendingLandlords}
          icon={Building2}
          variant="warning"
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
            <SelectItem value="pending_landlord">Chờ duyệt chủ trọ</SelectItem>
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

      {/* Rejection Dialog */}
      <RejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        onConfirm={handleRejectLandlordWithReason}
        type="user"
        itemName={selectedUserForReject?.full_name || undefined}
      />
    </div>
  );
}
