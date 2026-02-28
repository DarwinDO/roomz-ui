import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Handshake, Plus, MoreVertical, Eye, Edit, Trash2, Loader2, Tag, X, Crown } from "lucide-react";
import { usePartners, useTogglePartnerStatus, useDeletePartner, useCreatePartner, useUpdatePartner } from "@/hooks/usePartners";
import { useDeals, useCreateDeal, useDeleteDeal, useToggleDealActive } from "@/hooks/useDeals";
import { useConfirm } from "@/hooks/useConfirm";
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
  const [newDealIsPremium, setNewDealIsPremium] = useState(false);

  // Partner form state
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerDetailOpen, setPartnerDetailOpen] = useState(false);
  const [detailPartner, setDetailPartner] = useState<Partner | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("cafe");
  const [formSpecialization, setFormSpecialization] = useState("");
  const [formDiscount, setFormDiscount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formHours, setFormHours] = useState("");

  // Mutations
  const toggleStatus = useTogglePartnerStatus();
  const deletePartner = useDeletePartner();
  const createPartnerMutation = useCreatePartner();
  const updatePartnerMutation = useUpdatePartner();
  const createDeal = useCreateDeal();
  const deleteDeal = useDeleteDeal();
  const toggleDealActive = useToggleDealActive();

  // Fetch deals for selected partner
  const { data: partnerDeals = [] } = useDeals(
    { partnerId: selectedPartner?.id },
    { enabled: !!selectedPartner }
  );

  // Confirmation dialog
  const { confirm, ConfirmDialog } = useConfirm();

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
    const confirmed = await confirm({
      title: 'Xóa đối tác',
      description: `Bạn có chắc muốn xóa đối tác "${partner.name}"? Tất cả deals và vouchers liên quan cũng sẽ bị xóa.`,
      confirmText: 'Xóa',
      variant: 'destructive',
    });
    if (!confirmed) return;
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
        is_premium_only: newDealIsPremium,
      });
      toast.success('Đã tạo deal mới');
      setNewDealTitle("");
      setNewDealDiscount("");
      setNewDealValidUntil("");
      setNewDealIsPremium(false);
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
    const confirmed = await confirm({
      title: 'Xóa deal',
      description: `Bạn có chắc muốn xóa deal "${deal.title}"?`,
      confirmText: 'Xóa',
      variant: 'destructive',
    });
    if (!confirmed) return;
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

  const openCreateForm = () => {
    setEditingPartner(null);
    setFormName("");
    setFormCategory("cafe");
    setFormSpecialization("");
    setFormDiscount("");
    setFormDescription("");
    setFormAddress("");
    setFormPhone("");
    setFormEmail("");
    setFormHours("");
    setShowPartnerForm(true);
  };

  const openEditForm = (partner: Partner) => {
    setEditingPartner(partner);
    setFormName(partner.name);
    setFormCategory(partner.category);
    setFormSpecialization(partner.specialization || "");
    setFormDiscount(partner.discount || "");
    setFormDescription(partner.description || "");
    setFormAddress(partner.address || "");
    setFormPhone(partner.phone || "");
    setFormEmail(partner.email || "");
    setFormHours(partner.hours || "");
    setShowPartnerForm(true);
  };

  const openPartnerDetail = (partner: Partner) => {
    setDetailPartner(partner);
    setPartnerDetailOpen(true);
  };

  const handleSubmitPartner = async () => {
    if (!formName.trim() || !formCategory) {
      toast.error("Vui lòng nhập tên và danh mục");
      return;
    }
    const data = {
      name: formName.trim(),
      category: formCategory,
      specialization: formSpecialization.trim() || undefined,
      discount: formDiscount.trim() || undefined,
      description: formDescription.trim() || undefined,
      address: formAddress.trim() || undefined,
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      hours: formHours.trim() || undefined,
    };
    try {
      if (editingPartner) {
        await updatePartnerMutation.mutateAsync({ id: editingPartner.id, data });
        toast.success("Đã cập nhật đối tác");
      } else {
        await createPartnerMutation.mutateAsync(data);
        toast.success("Đã tạo đối tác thành công");
      }
      setShowPartnerForm(false);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Lỗi không xác định";
      toast.error(editingPartner ? "Lỗi cập nhật" : "Lỗi tạo đối tác", { description: errMsg });
    }
  };

  const columns: ColumnDef<Partner>[] = [
    {
      id: "partner",
      header: "Đối tác",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{getCategoryLabel(item.category)}</div>
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "discount",
      header: "Ưu đãi",
      cell: ({ row }) => (
        <Badge className="bg-green-100 text-green-700">{row.original.discount || 'N/A'}</Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }
        >
          {row.original.status === "active" ? "Hoạt động" : "Ngừng"}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "views",
      header: "Lượt xem",
      cell: ({ row }) => (
        <span className="text-gray-600">{(row.original.views || 0).toLocaleString('vi-VN')}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "created_at",
      header: "Ngày tham gia",
      cell: ({ row }) => (
        <span className="text-gray-600 text-sm">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('vi-VN') : '-'}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openPartnerDetail(item)}>
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedPartner(item); setShowDealsList(true); }}>
                <Tag className="h-4 w-4 mr-2" />
                Quản lý deals
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditForm(item)}>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đối tác</h1>
          <p className="text-gray-600 mt-1">Quản lý các đối tác Local Passport</p>
        </div>
        <Button onClick={openCreateForm}>
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
                      <div className="font-medium flex items-center gap-2">
                        {deal.title}
                        {deal.is_premium_only && (
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
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
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">Deal Premium</span>
              </div>
              <Switch
                checked={newDealIsPremium}
                onCheckedChange={setNewDealIsPremium}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog />

      {/* Partner Form Dialog (Create/Edit) */}
      <Dialog open={showPartnerForm} onOpenChange={setShowPartnerForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Chỉnh sửa đối tác' : 'Thêm đối tác mới'}</DialogTitle>
            <DialogDescription>
              {editingPartner ? 'Cập nhật thông tin đối tác' : 'Nhập thông tin để thêm đối tác mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Tên đối tác *</Label>
              <Input id="partner-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="VD: Quán Cà Phê ABC" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-category">Danh mục *</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cafe">Quán cà phê</SelectItem>
                  <SelectItem value="gym">Phòng gym</SelectItem>
                  <SelectItem value="laundry">Giặt là</SelectItem>
                  <SelectItem value="restaurant">Nhà hàng</SelectItem>
                  <SelectItem value="food">Đồ ăn</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-specialization">Chuyên môn</Label>
              <Input id="partner-specialization" value={formSpecialization} onChange={e => setFormSpecialization(e.target.value)} placeholder="VD: Cà phê đặc sản" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-discount">Ưu đãi</Label>
              <Input id="partner-discount" value={formDiscount} onChange={e => setFormDiscount(e.target.value)} placeholder="VD: Giảm 20%" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-description">Mô tả</Label>
              <Textarea id="partner-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Mô tả ngắn về đối tác..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner-phone">Điện thoại</Label>
                <Input id="partner-phone" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="0901234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-email">Email</Label>
                <Input id="partner-email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="contact@partner.vn" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-address">Địa chỉ</Label>
              <Input id="partner-address" value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="Số nhà, đường, quận..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-hours">Giờ mở cửa</Label>
              <Input id="partner-hours" value={formHours} onChange={e => setFormHours(e.target.value)} placeholder="VD: 7:00 - 22:00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartnerForm(false)}>Hủy</Button>
            <Button
              onClick={handleSubmitPartner}
              disabled={createPartnerMutation.isPending || updatePartnerMutation.isPending}
            >
              {(createPartnerMutation.isPending || updatePartnerMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPartner ? 'Cập nhật' : 'Tạo đối tác'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Detail Dialog */}
      <Dialog open={partnerDetailOpen} onOpenChange={setPartnerDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đối tác</DialogTitle>
          </DialogHeader>
          {detailPartner && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Handshake className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{detailPartner.name}</h3>
                  <p className="text-sm text-gray-500">{getCategoryLabel(detailPartner.category)}</p>
                </div>
                <Badge className={detailPartner.status === 'active' ? 'bg-green-100 text-green-700 ml-auto' : 'bg-gray-100 text-gray-700 ml-auto'}>
                  {detailPartner.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {detailPartner.discount && (
                  <div>
                    <p className="text-gray-500">Ưu đãi</p>
                    <p className="font-medium">{detailPartner.discount}</p>
                  </div>
                )}
                {detailPartner.specialization && (
                  <div>
                    <p className="text-gray-500">Chuyên môn</p>
                    <p className="font-medium">{detailPartner.specialization}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Lượt xem</p>
                  <p className="font-medium">{(detailPartner.views || 0).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Đánh giá</p>
                  <p className="font-medium">{detailPartner.rating || 0} ⭐ ({detailPartner.review_count || 0})</p>
                </div>
                {detailPartner.phone && (
                  <div>
                    <p className="text-gray-500">Điện thoại</p>
                    <p className="font-medium">{detailPartner.phone}</p>
                  </div>
                )}
                {detailPartner.email && (
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{detailPartner.email}</p>
                  </div>
                )}
                {detailPartner.address && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Địa chỉ</p>
                    <p className="font-medium">{detailPartner.address}</p>
                  </div>
                )}
                {detailPartner.hours && (
                  <div>
                    <p className="text-gray-500">Giờ mở cửa</p>
                    <p className="font-medium">{detailPartner.hours}</p>
                  </div>
                )}
                {detailPartner.description && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Mô tả</p>
                    <p className="font-medium">{detailPartner.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Ngày tham gia</p>
                  <p className="font-medium">{detailPartner.created_at ? new Date(detailPartner.created_at).toLocaleDateString('vi-VN') : '-'}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPartnerDetailOpen(false)}>Đóng</Button>
                <Button onClick={() => { setPartnerDetailOpen(false); openEditForm(detailPartner); }}>
                  <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


