import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ClipboardList,
    MoreVertical,
    Eye,
    CheckCircle,
    XCircle,
    Phone,
    Mail,
    MapPin,
    User,
    Building2,
    Loader2,
    ArrowRight,
} from "lucide-react";
import { usePartnerLeads, useUpdatePartnerLeadStatus } from "@/hooks/usePartnerLeads";
import { useCreatePartner } from "@/hooks/usePartners";
import { useConfirm } from "@/hooks/useConfirm";
import { toast } from "sonner";
import type { PartnerLead, PartnerLeadStatus } from "@/services/partnerLeads";

export default function PartnerLeadsPage() {
    const { data: leads = [], isLoading, refetch } = usePartnerLeads();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<PartnerLeadStatus | 'all'>('all');
    const [selectedLead, setSelectedLead] = useState<PartnerLead | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [createPartnerOpen, setCreatePartnerOpen] = useState(false);

    const updateStatus = useUpdatePartnerLeadStatus();
    const createPartner = useCreatePartner();
    const { confirm, ConfirmDialog } = useConfirm();

    const filteredLeads = leads.filter((lead) => {
        const matchesSearch =
            lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: PartnerLeadStatus) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Chờ xử lý
                    </Badge>
                );
            case "contacted":
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Đã liên hệ
                    </Badge>
                );
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Đã duyệt
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        Từ chối
                    </Badge>
                );
        }
    };

    const handleStatusChange = async (lead: PartnerLead, newStatus: PartnerLeadStatus) => {
        try {
            await updateStatus.mutateAsync({ id: lead.id, status: newStatus });
            toast.success(`Đã cập nhật trạng thái thành ${getStatusLabel(newStatus)}`);
            refetch();
        } catch {
            toast.error("Lỗi khi cập nhật trạng thái");
        }
    };

    const handleApproveAndCreate = async () => {
        if (!selectedLead) return;

        const confirmed = await confirm({
            title: "Tạo đối tác từ đơn đăng ký",
            description: `Bạn có chắc muốn tạo đối tác "${selectedLead.company_name}" từ đơn đăng ký này?`,
            confirmText: "Tạo đối tác",
        });

        if (!confirmed) return;

        try {
            // Create partner from lead
            await createPartner.mutateAsync({
                name: selectedLead.company_name,
                category: "other", // Admin can change later
                phone: selectedLead.phone,
                email: selectedLead.email,
                description: selectedLead.notes,
            });

            // Update lead status to approved
            await updateStatus.mutateAsync({
                id: selectedLead.id,
                status: "approved",
            });

            toast.success("Đã tạo đối tác thành công!");
            setCreatePartnerOpen(false);
            setDetailOpen(false);
            refetch();
        } catch {
            toast.error("Lỗi khi tạo đối tác");
        }
    };

    const getStatusLabel = (status: PartnerLeadStatus) => {
        switch (status) {
            case "pending":
                return "Chờ xử lý";
            case "contacted":
                return "Đã liên hệ";
            case "approved":
                return "Đã duyệt";
            case "rejected":
                return "Từ chối";
        }
    };

    const columns: ColumnDef<PartnerLead>[] = [
        {
            id: "company",
            header: "Doanh nghiệp",
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="font-medium">{lead.company_name}</div>
                            <div className="text-sm text-gray-500">{lead.contact_name}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "email",
            header: "Liên hệ",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600">{row.original.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600">{row.original.phone}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "service_area",
            header: "Khu vực",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600">{row.original.service_area}</span>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            accessorKey: "created_at",
            header: "Ngày đăng ký",
            cell: ({ row }) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.original.created_at).toLocaleDateString("vi-VN")}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Thao tác",
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedLead(lead); setDetailOpen(true); }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                            </DropdownMenuItem>
                            {lead.status === "pending" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(lead, "contacted")}>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Đánh dấu đã liên hệ
                                </DropdownMenuItem>
                            )}
                            {(lead.status === "pending" || lead.status === "contacted") && (
                                <DropdownMenuItem onClick={() => { setSelectedLead(lead); setCreatePartnerOpen(true); }}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    Duyệt & Tạo đối tác
                                </DropdownMenuItem>
                            )}
                            {lead.status !== "rejected" && lead.status !== "approved" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(lead, "rejected")}>
                                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                    Từ chối
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingCount = leads.filter((l) => l.status === "pending").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Đơn đăng ký đối tác</h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý các đơn đăng ký trở thành đối tác từ doanh nghiệp
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                    <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                    <div className="text-sm text-amber-700 mt-1">Chờ xử lý</div>
                </div>
                <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{leads.length}</div>
                    <div className="text-sm text-gray-600 mt-1">Tổng đơn</div>
                </div>
                <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                        {leads.filter((l) => l.status === "approved").length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Đã duyệt</div>
                </div>
                <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                        {leads.filter((l) => l.status === "contacted").length}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Đã liên hệ</div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as PartnerLeadStatus | 'all')}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="contacted">Đã liên hệ</SelectItem>
                        <SelectItem value="approved">Đã duyệt</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Data Table */}
            <DataTable
                data={filteredLeads}
                columns={columns}
                searchPlaceholder="Tìm doanh nghiệp, ngườ liên hệ..."
                onSearch={setSearchTerm}
                pageSize={10}
            />

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Chi tiết đơn đăng ký</DialogTitle>
                        <DialogDescription>
                            Thông tin chi tiết từ doanh nghiệp đăng ký
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLead && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-7 h-7 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold">{selectedLead.company_name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">{selectedLead.contact_name}</span>
                                    </div>
                                </div>
                                {getStatusBadge(selectedLead.status)}
                            </div>

                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{selectedLead.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{selectedLead.phone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{selectedLead.service_area}</span>
                                </div>
                            </div>

                            {selectedLead.notes && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500 mb-2">Ghi chú:</p>
                                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedLead.notes}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t text-sm text-gray-500">
                                Ngày đăng ký: {new Date(selectedLead.created_at).toLocaleString("vi-VN")}
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                                    Đóng
                                </Button>
                                {selectedLead.status === "pending" && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleStatusChange(selectedLead, "contacted")}
                                    >
                                        <Phone className="w-4 h-4 mr-2" />
                                        Đánh dấu đã liên hệ
                                    </Button>
                                )}
                                {(selectedLead.status === "pending" || selectedLead.status === "contacted") && (
                                    <Button onClick={() => setCreatePartnerOpen(true)}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Duyệt & Tạo đối tác
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Partner from Lead Dialog */}
            <Dialog open={createPartnerOpen} onOpenChange={setCreatePartnerOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo đối tác từ đơn đăng ký</DialogTitle>
                        <DialogDescription>
                            Thông tin sẽ được chuyển sang trang quản lý đối tác
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLead && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tên doanh nghiệp:</span>
                                    <span className="font-medium">{selectedLead.company_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ngườ liên hệ:</span>
                                    <span>{selectedLead.contact_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Email:</span>
                                    <span>{selectedLead.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Điện thoại:</span>
                                    <span>{selectedLead.phone}</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600">
                                Sau khi tạo, bạn có thể bổ sung thêm thông tin như địa chỉ, giờ mở cửa,
                                tọa độ map trong trang Quản lý đối tác.
                            </p>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreatePartnerOpen(false)}>
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleApproveAndCreate}
                                    disabled={createPartner.isPending}
                                >
                                    {createPartner.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="w-4 h-4 mr-2" />
                                            Xác nhận tạo đối tác
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog />
        </div>
    );
}
