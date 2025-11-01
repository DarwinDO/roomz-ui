import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Handshake, Plus, MoreVertical, Eye, Edit, Trash2, BarChart } from "lucide-react";
import { mockPartners, type Partner } from "@/data/adminData";
import { toast } from "sonner";

export default function PartnersPage() {
  const [partners, setPartners] = useState(mockPartners);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPartners = partners.filter(partner => 
    partner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = (id: string) => {
    setPartners(partners.map(p => 
      p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p
    ));
    toast.success("Đã cập nhật trạng thái đối tác");
  };

  const handleDelete = (id: string) => {
    setPartners(partners.filter(p => p.id !== id));
    toast.success("Đã xóa đối tác");
  };

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case "cafe": return "Quán cà phê";
      case "gym": return "Phòng gym";
      case "laundry": return "Giặt là";
      case "restaurant": return "Nhà hàng";
      default: return "Khác";
    }
  };

  const columns = [
    {
      key: "partner",
      label: "Đối tác",
      render: (item: Partner) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Handshake className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-gray-500">{getCategoryLabel(item.category)}</div>
          </div>
        </div>
      ),
    },
    {
      key: "discount",
      label: "Ưu đãi",
      render: (item: Partner) => (
        <Badge className="bg-green-100 text-green-700">{item.discount}</Badge>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: Partner) => (
        <Badge 
          className={
            item.status === "active" 
              ? "bg-green-100 text-green-700" 
              : "bg-gray-100 text-gray-700"
          }
        >
          {item.status === "active" ? "Hoạt động" : "Ngừng"}
        </Badge>
      ),
    },
    {
      key: "views",
      label: "Lượt xem",
      render: (item: Partner) => (
        <span className="text-gray-600">{item.views?.toLocaleString('vi-VN')}</span>
      ),
    },
    {
      key: "joinDate",
      label: "Ngày tham gia",
      render: (item: Partner) => (
        <span className="text-gray-600 text-sm">
          {new Date(item.joinDate).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Thao tác",
      render: (item: Partner) => (
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
            <DropdownMenuItem>
              <BarChart className="h-4 w-4 mr-2" />
              Xem thống kê
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(item.id)}>
              {item.status === "active" ? "Ngừng hoạt động" : "Kích hoạt"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(item.id)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đối tác</h1>
          <p className="text-gray-600 mt-1">Quản lý các đối tác Local Passport</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Thêm đối tác
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold text-primary">{partners.length}</div>
          <div className="text-sm text-gray-600 mt-1">Tổng đối tác</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {partners.filter(p => p.status === "active").length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Đang hoạt động</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {partners.filter(p => p.category === "cafe").length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Quán cà phê</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {partners.filter(p => p.category === "gym").length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Phòng gym</div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredPartners}
        columns={columns}
        searchPlaceholder="Tìm đối tác..."
        onSearch={setSearchTerm}
        pageSize={10}
      />
    </div>
  );
}


