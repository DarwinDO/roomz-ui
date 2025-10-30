import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Users, UserCheck, UserX, MoreVertical, Eye, Ban, Trash2, CheckCircle } from "lucide-react";
import { mockUsers, type AdminUser } from "@/data/adminData";
import { toast } from "sonner";

export default function UsersPage() {
  const [filter, setFilter] = useState("all");
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filter === "all" ? true :
      filter === "active" ? user.status === "active" :
      filter === "suspended" ? user.status === "suspended" :
      filter === "verified" ? user.verified : true;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    suspended: users.filter(u => u.status === "suspended").length,
    verified: users.filter(u => u.verified).length,
  };

  const handleSuspend = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u
    ));
    toast.success("Đã cập nhật trạng thái người dùng");
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast.success("Đã xóa người dùng");
  };

  const handleVerify = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, verified: true } : u
    ));
    toast.success("Đã xác thực người dùng");
  };

  const handleBulkDelete = (selected: AdminUser[]) => {
    setUsers(users.filter(u => !selected.some(s => s.id === u.id)));
    toast.success(`Đã xóa ${selected.length} người dùng`);
  };

  const columns = [
    {
      key: "user",
      label: "Người dùng",
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Vai trò",
      render: (user: AdminUser) => (
        <Badge variant="outline">
          {user.role === "admin" ? "Quản trị" : user.role === "landlord" ? "Chủ nhà" : "Người dùng"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (user: AdminUser) => (
        <Badge 
          variant={user.status === "active" ? "default" : "secondary"}
          className={
            user.status === "active" ? "bg-green-100 text-green-700" :
            user.status === "suspended" ? "bg-red-100 text-red-700" :
            "bg-yellow-100 text-yellow-700"
          }
        >
          {user.status === "active" ? "Hoạt động" : user.status === "suspended" ? "Đình chỉ" : "Chờ duyệt"}
        </Badge>
      ),
    },
    {
      key: "verified",
      label: "Xác thực",
      render: (user: AdminUser) => (
        user.verified ? (
          <Badge className="bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã xác thực
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">Chưa xác thực</span>
        )
      ),
    },
    {
      key: "joinDate",
      label: "Ngày tham gia",
      render: (user: AdminUser) => (
        <span className="text-gray-600">
          {new Date(user.joinDate).toLocaleDateString('vi-VN')}
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
            {!user.verified && (
              <DropdownMenuItem onClick={() => handleVerify(user.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Xác thực
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
              <Ban className="h-4 w-4 mr-2" />
              {user.status === "suspended" ? "Kích hoạt" : "Đình chỉ"}
            </DropdownMenuItem>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-gray-600 mt-1">Quản lý tất cả người dùng trong hệ thống</p>
      </div>

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
          title="Đã xác thực"
          value={stats.verified}
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
            <SelectItem value="verified">Đã xác thực</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Tìm theo tên hoặc email..."
        onSearch={setSearchTerm}
        selectable
        onSelectionChange={handleBulkDelete}
        pageSize={15}
      />
    </div>
  );
}


