import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Handshake, Plus, MoreVertical, Eye, Edit, Trash2, BarChart, Loader2, Tag, X } from "lucide-react";
import { usePartners, useTogglePartnerStatus, useDeletePartner } from "@/hooks/usePartners";
import { useDeals, useCreateDeal, useDeleteDeal, useToggleDealActive } from "@/hooks/useDeals";
import { toast } from "sonner";
import type { Partner } from "@/services/partners";
import type { Deal } from "@/services/deals";

export default function PartnersPage() {
  const { data: partners = [], isLoading } = usePartners({ status: 'all' });
  const [searchTerm, setSearchTerm] = useState("");

  // Deal management state
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [showDealsList, setShowDealsList] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealDiscount, setNewDealDiscount] = useState("");
  const [newDealValidUntil, setNewDealValidUntil] = useState("");

  // Mutations
  const toggleStatus = useTogglePartnerStatus();
  const deletePartner = useDeletePartner();
  const createDeal = useCreateDeal();
  const deleteDeal = useDeleteDeal();
  const toggleDealActive = useToggleDealActive();

  // Fetch deals for selected partner
  const { data: partnerDeals = [] } = useDeals(
    { partnerId: selectedPartner?.id },
    { enabled: !!selectedPartner }
  );

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (partner: Partner) => {
    try {
      await toggleStatus.mutateAsync(partner.id);
      toast.success(partner.status === 'active' ? 'Đã ngừng kích hoạt' : 'Đã kích hoạt');
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (partner: Partner) => {
    if (!confirm(`Bạn có chắc muốn xóa đối tác "${partner.name}"? Tất cả deals và vouchers liên quan cũng sẽ bị xóa.`)) {
      return;
    }
    try {
      await deletePartner.mutateAsync(partner.id);
      toast.success('Đã xóa đối tác');
    } catch {
      toast.error('Lỗi khi xóa đối tác');
    }
  };

  const handleCreateDeal = async () => {
    if (!selectedPartner || !newDealTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề deal');
      return;
    }
    try {
      await createDeal.mutateAsync({
        partner_id: selectedPartner.id,
        title: newDealTitle.trim(),
        discount_value: newDealDiscount.trim() || undefined,
        valid_until: newDealValidUntil || undefined,
      });
      toast.success('Đã tạo deal mới');
      setNewDealTitle("");
      setNewDealDiscount("");
      setNewDealValidUntil("");
      setShowDealDialog(false);
    } catch {
      toast.error('Lỗi khi tạo deal');
    }
  };

  const handleToggleDeal = async (deal: Deal) => {
    try {
      await toggleDealActive.mutateAsync(deal.id);
      toast.success(deal.is_active ? 'Đã ngừng kích hoạt deal' : 'Đã kích hoạt deal');
    } catch {
      toast.error('Lỗi khi cập nhật deal');
    }
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (!confirm(`Bạn có chắc muốn xóa deal "${deal.title}"?`)) {
      return;
    }
    try {
      await deleteDeal.mutateAsync(deal.id);
      toast.success('Đã xóa deal');
    } catch {
      toast.error('Lỗi khi xóa deal');
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "cafe": return "Quán cà phê";
      case "gym": return "Phòng gym";
      case "laundry": return "Giặt là";
      case "restaurant": return "Nhà hàng";
      case "food": return "Đồ ăn";
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
        <Badge className="bg-green-100 text-green-700">{item.discount || 'N/A'}</Badge>
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
        <span className="text-gray-600">{(item.views || 0).toLocaleString('vi-VN')}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Ngày tham gia",
      render: (item: Partner) => (
        <span className="text-gray-600 text-sm">
          {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '-'}
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
            <DropdownMenuItem onClick={() => { setSelectedPartner(item); setShowDealsList(true); }}>
              <Tag className="h-4 w-4 mr-2" />
              Quản lý deals
            </DropdownMenuItem>
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
            <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
              {item.status === "active" ? "Ngừng hoạt động" : "Kích hoạt"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(item)}
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

      {/* Deal Management Dialog */}
      <Dialog open={showDealsList} onOpenChange={setShowDealsList}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quản lý deals - {selectedPartner?.name}</DialogTitle>
            <DialogDescription>
              Thêm, kích hoạt hoặc xóa deals của đối tác này
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Add new deal button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setNewDealTitle("");
                setNewDealDiscount("");
                setNewDealValidUntil("");
                setShowDealDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm deal mới
            </Button>

            {/* Deals list */}
            {partnerDeals.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có deal nào</p>
            ) : (
              <div className="space-y-2">
                {partnerDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{deal.title}</div>
                      <div className="text-sm text-gray-500">
                        {deal.discount_value && <span className="mr-2">{deal.discount_value}</span>}
                        {deal.valid_until && (
                          <span className="text-xs">Hết hạn: {new Date(deal.valid_until).toLocaleDateString('vi-VN')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={deal.is_active ? "bg-green-100 text-green-700" : "bg-gray-100"}>
                        {deal.is_active ? "Hoạt động" : "Ngừng"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleDeal(deal)}
                      >
                        {deal.is_active ? <X className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDeleteDeal(deal)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Deal Dialog */}
      <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo deal mới</DialogTitle>
            <DialogDescription>
              Thêm deal mới cho {selectedPartner?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tiêu đề deal *</label>
              <Input
                value={newDealTitle}
                onChange={(e) => setNewDealTitle(e.target.value)}
                placeholder="VD: Giảm 20% cho sinh viên"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Giảm giá</label>
              <Input
                value={newDealDiscount}
                onChange={(e) => setNewDealDiscount(e.target.value)}
                placeholder="VD: 20%"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hết hạn</label>
              <Input
                type="date"
                value={newDealValidUntil}
                onChange={(e) => setNewDealValidUntil(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDealDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateDeal}>
              Tạo deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


