import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";
import { StatsCard } from "@/components/admin/StatsCard";
import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Wrench,
    CheckCircle,
    Clock,
    Star,
    MoreVertical,
    Eye,
    Check,
    X,
    Loader2,
    AlertCircle,
    User,
    Building2,
} from "lucide-react";
import { useAdminServiceLeads, useServiceLeadStats, useUpdateLeadStatus, useAssignPartner, useAppendAdminNote } from "@/hooks/useAdminServiceLeads";
import type { AdminServiceLead } from "@/services/admin";
import { toast } from "sonner";
import { usePartners } from "@/hooks/usePartners";

const SERVICE_TYPE_LABELS: Record<string, string> = {
    moving: "Chuyển nhà",
    cleaning: "Dọn dẹp",
    setup: "Lắp đặt",
    support: "Hỗ trợ",
};

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
    submitted: { label: "Mới", variant: "bg-blue-100 text-blue-700" },
    assigned: { label: "Đã gán", variant: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Đã xác nhận", variant: "bg-purple-100 text-purple-700" },
    completed: { label: "Hoàn thành", variant: "bg-green-100 text-green-700" },
    cancelled: { label: "Đã hủy", variant: "bg-red-100 text-red-700" },
    rejected: { label: "Từ chối", variant: "bg-red-100 text-red-700" },
};

// Detail labels for service types
const DETAIL_LABELS: Record<string, Record<string, { label: string; icon?: string }>> = {
    cleaning: {
        address: { label: "Địa chỉ", icon: "📍" },
        cleaning_type: { label: "Loại dọn dẹp", icon: "🧹" },
        num_rooms: { label: "Số phòng", icon: "🏠" },
        num_bathrooms: { label: "Số phòng tắm", icon: "🚿" },
        preferred_time: { label: "Giờ ưu tiên", icon: "⏰" },
        add_ons: { label: "Dịch vụ thêm", icon: "✨" },
        notes: { label: "Ghi chú", icon: "📝" },
        contact_phone: { label: "SĐT liên hệ", icon: "📞" },
    },
    moving: {
        pickup_address: { label: "Địa chỉ đón", icon: "📍" },
        destination_address: { label: "Địa chỉ đến", icon: "🏁" },
        floor_pickup: { label: "Tầng đón", icon: "🔢" },
        floor_destination: { label: "Tầng đến", icon: "🔢" },
        has_elevator_pickup: { label: "Thang máy (đón)", icon: "🛗" },
        has_elevator_destination: { label: "Thang máy (đến)", icon: "🛗" },
        items: { label: "Đồ đạc", icon: "📦" },
        notes: { label: "Ghi chú", icon: "📝" },
        contact_phone: { label: "SĐT liên hệ", icon: "📞" },
    },
    setup: {
        address: { label: "Địa chỉ", icon: "📍" },
        setup_type: { label: "Loại lắp đặt", icon: "🔧" },
        items: { label: "Thiết bị", icon: "📦" },
        notes: { label: "Ghi chú", icon: "📝" },
        contact_phone: { label: "SĐT liên hệ", icon: "📞" },
    },
    support: {
        message: { label: "Nội dung", icon: "💬" },
        category: { label: "Danh mục", icon: "📁" },
        notes: { label: "Ghi chú", icon: "📝" },
        contact_phone: { label: "SĐT liên hệ", icon: "📞" },
    },
};

const CLEANING_TYPE_LABELS: Record<string, string> = {
    basic: "Dọn dẹp cơ bản",
    deep: "Dọn dẹp sâu",
    move_in: "Dọn dẹp khi dọn vào",
    move_out: "Dọn dẹp khi dọn đi",
};

const SETUP_TYPE_LABELS: Record<string, string> = {
    furniture: "Nội thất",
    appliances: "Thiết bị điện",
    full: "Trọn gói",
};

function formatDetailValue(key: string, value: unknown): string {
    if (value === null || value === undefined) return "Không có";
    if (typeof value === "boolean") return value ? "Có" : "Không";
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "Không có";
    if (key === "cleaning_type") return CLEANING_TYPE_LABELS[value as string] || String(value);
    if (key === "setup_type") return SETUP_TYPE_LABELS[value as string] || String(value);
    return String(value);
}

export default function ServiceLeadsPage() {
    const { data: leads, isLoading, error, refetch } = useAdminServiceLeads();
    const { data: stats } = useServiceLeadStats();
    const { mutate: updateStatus } = useUpdateLeadStatus();
    const { mutate: assignPartner } = useAssignPartner();
    const { mutate: appendNote } = useAppendAdminNote();
    const { data: partners } = usePartners();

    const [filter, setFilter] = useState("all");
    const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLead, setSelectedLead] = useState<AdminServiceLead | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedPartnerId, setSelectedPartnerId] = useState("");
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [adminNote, setAdminNote] = useState("");

    const filteredLeads = (leads || []).filter(lead => {
        const matchesSearch =
            lead.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.partner?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === "all" ? true : lead.status === filter;
        const matchesServiceType = serviceTypeFilter === "all" ? true : lead.service_type === serviceTypeFilter;

        return matchesSearch && matchesFilter && matchesServiceType;
    });

    const handleConfirm = (leadId: string) => {
        updateStatus({ leadId, status: "confirmed" });
    };

    const handleComplete = (leadId: string) => {
        updateStatus({ leadId, status: "completed" });
    };

    const openRejectDialog = (lead: AdminServiceLead) => {
        setSelectedLead(lead);
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    const handleReject = () => {
        if (!selectedLead) return;
        updateStatus({ leadId: selectedLead.id, status: "rejected", reason: rejectReason });
        setRejectDialogOpen(false);
    };

    const openAssignDialog = (lead: AdminServiceLead) => {
        setSelectedLead(lead);
        setSelectedPartnerId(lead.partner_id || "");
        setAssignDialogOpen(true);
    };

    const handleAssign = () => {
        if (!selectedLead || !selectedPartnerId) return;
        assignPartner({ leadId: selectedLead.id, partnerId: selectedPartnerId });
        setAssignDialogOpen(false);
    };

    const openDetailDialog = (lead: AdminServiceLead) => {
        setSelectedLead(lead);
        setDetailOpen(true);
    };

    const handleAddNote = () => {
        if (!selectedLead || !adminNote.trim()) return;
        appendNote({ leadId: selectedLead.id, note: adminNote, adminName: "Admin" });
        setAdminNote("");
        setNoteDialogOpen(false);
    };

    const getStatusBadge = (status: string | null) => {
        const statusInfo = STATUS_LABELS[status || ""];
        if (!statusInfo) return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
        return <Badge className={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    const columns: ColumnDef<AdminServiceLead>[] = [
        {
            id: "lead",
            header: "Yêu cầu",
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="font-medium">{SERVICE_TYPE_LABELS[lead.service_type] || lead.service_type}</div>
                            <div className="text-xs text-gray-500">
                                {lead.preferred_date ? new Date(lead.preferred_date).toLocaleDateString('vi-VN') : 'Không có ngày ưu tiên'}
                            </div>
                        </div>
                    </div>
                );
            },
            enableSorting: false,
        },
        {
            id: "user",
            header: "Khách hàng",
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                            <span className="text-gray-600">{lead.user?.full_name || "N/A"}</span>
                            <div className="text-xs text-gray-400">{lead.user?.email}</div>
                        </div>
                    </div>
                );
            },
            enableSorting: false,
        },
        {
            id: "partner",
            header: "Đối tác",
            cell: ({ row }) => {
                const lead = row.original;
                return lead.partner ? (
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{lead.partner.name}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">Chưa gán</span>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => getStatusBadge(row.original.status),
            enableSorting: true,
        },
        {
            accessorKey: "estimated_price",
            header: "Giá ước tính",
            cell: ({ row }) => (
                <span className="font-medium">
                    {row.original.estimated_price ? `${row.original.estimated_price.toLocaleString('vi-VN')}đ` : "-"}
                </span>
            ),
            enableSorting: true,
        },
        {
            accessorKey: "created_at",
            header: "Ngày tạo",
            cell: ({ row }) => (
                <span className="text-gray-600 text-sm">
                    {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('vi-VN') : "-"}
                </span>
            ),
            enableSorting: true,
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
                            <DropdownMenuItem onClick={() => openDetailDialog(lead)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                            </DropdownMenuItem>
                            {!lead.partner_id && lead.status === "submitted" && (
                                <DropdownMenuItem onClick={() => openAssignDialog(lead)}>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Gán đối tác
                                </DropdownMenuItem>
                            )}
                            {lead.status === "assigned" && (
                                <DropdownMenuItem onClick={() => handleConfirm(lead.id)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Xác nhận
                                </DropdownMenuItem>
                            )}
                            {lead.status === "confirmed" && (
                                <DropdownMenuItem onClick={() => handleComplete(lead.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Hoàn thành
                                </DropdownMenuItem>
                            )}
                            {lead.status !== "completed" && lead.status !== "cancelled" && lead.status !== "rejected" && (
                                <>
                                    <DropdownMenuItem onClick={() => openRejectDialog(lead)} className="text-red-600">
                                        <X className="h-4 w-4 mr-2" />
                                        Từ chối
                                    </DropdownMenuItem>
                                </>
                            )}
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
                <h1 className="text-3xl font-bold text-gray-900">Quản lý dịch vụ</h1>
                <p className="text-gray-600 mt-1">Quản lý tất cả yêu cầu dịch vụ trong hệ thống</p>
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
                    title="Tổng yêu cầu"
                    value={stats?.total || 0}
                    icon={Wrench}
                    variant="default"
                />
                <StatsCard
                    title="Chờ xử lý"
                    value={stats?.submitted || 0}
                    icon={Clock}
                    variant="warning"
                />
                <StatsCard
                    title="Đang xử lý"
                    value={stats?.assigned || 0}
                    icon={CheckCircle}
                    variant="info"
                />
                <StatsCard
                    title="Hoàn thành"
                    value={stats?.completed || 0}
                    icon={Star}
                    variant="success"
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="submitted">Mới</SelectItem>
                        <SelectItem value="assigned">Đã gán</SelectItem>
                        <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Loại dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả dịch vụ</SelectItem>
                        <SelectItem value="moving">Chuyển nhà</SelectItem>
                        <SelectItem value="cleaning">Dọn dẹp</SelectItem>
                        <SelectItem value="setup">Lắp đặt</SelectItem>
                        <SelectItem value="support">Hỗ trợ</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Data Table */}
            <DataTable
                data={filteredLeads}
                columns={columns}
                searchPlaceholder="Tìm theo tên khách hàng hoặc đối tác..."
                onSearch={setSearchTerm}
                pageSize={15}
            />

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết yêu cầu dịch vụ</DialogTitle>
                    </DialogHeader>
                    {selectedLead && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">Loại dịch vụ</Label>
                                    <p className="font-medium">{SERVICE_TYPE_LABELS[selectedLead.service_type]}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Trạng thái</Label>
                                    <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Khách hàng</Label>
                                    <p className="font-medium">{selectedLead.user?.full_name}</p>
                                    <p className="text-sm text-gray-500">{selectedLead.user?.email}</p>
                                    {selectedLead.user?.phone && (
                                        <p className="text-sm text-gray-500">{selectedLead.user?.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-gray-500">Đối tác</Label>
                                    <p className="font-medium">{selectedLead.partner?.name || "Chưa gán"}</p>
                                    {selectedLead.partner?.rating && (
                                        <p className="text-sm text-gray-500">⭐ {selectedLead.partner.rating}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-gray-500">Ngày ưu tiên</Label>
                                    <p className="font-medium">
                                        {selectedLead.preferred_date
                                            ? new Date(selectedLead.preferred_date).toLocaleDateString('vi-VN')
                                            : "Không có"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Giá ước tính</Label>
                                    <p className="font-medium">
                                        {selectedLead.estimated_price
                                            ? `${selectedLead.estimated_price.toLocaleString('vi-VN')}đ`
                                            : "Chưa có"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-500">Chi tiết yêu cầu</Label>
                                <div className="mt-1 p-4 bg-gray-50 rounded-lg space-y-2">
                                    {Object.entries(selectedLead.details as Record<string, unknown>).map(([key, value]) => {
                                        const labels = DETAIL_LABELS[selectedLead.service_type] || {};
                                        const fieldInfo = labels[key] || { label: key, icon: "📋" };
                                        return (
                                            <div key={key} className="flex items-start gap-2 text-sm">
                                                <span>{fieldInfo.icon}</span>
                                                <span className="text-gray-500 min-w-[120px]">{fieldInfo.label}:</span>
                                                <span className="font-medium text-gray-800">{formatDetailValue(key, value)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedLead.admin_notes && (
                                <div>
                                    <Label className="text-gray-500">Ghi chú admin</Label>
                                    <pre className="mt-1 p-3 bg-yellow-50 rounded-lg text-sm whitespace-pre-wrap">
                                        {selectedLead.admin_notes}
                                    </pre>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setNoteDialogOpen(true); }}
                                >
                                    Thêm ghi chú
                                </Button>
                            </div>

                            {selectedLead.rejection_reason && (
                                <div>
                                    <Label className="text-gray-500">Lý do từ chối</Label>
                                    <p className="mt-1 text-red-600">{selectedLead.rejection_reason}</p>
                                </div>
                            )}

                            {selectedLead.user_rating && (
                                <div>
                                    <Label className="text-gray-500">Đánh giá</Label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-yellow-500">{"⭐".repeat(selectedLead.user_rating)}</span>
                                        <span className="text-gray-500">({selectedLead.user_rating}/5)</span>
                                    </div>
                                    {selectedLead.user_review && (
                                        <p className="mt-1 text-gray-600">{selectedLead.user_review}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối yêu cầu</DialogTitle>
                        <DialogDescription>
                            Vui lòng nhập lý do từ chối yêu cầu dịch vụ này.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Nhập lý do từ chối..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={handleReject}>Từ chối</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Partner Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gán đối tác</DialogTitle>
                        <DialogDescription>
                            Chọn đối tác để xử lý yêu cầu dịch vụ này.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Đối tác</Label>
                        <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Chọn đối tác" />
                            </SelectTrigger>
                            <SelectContent>
                                {(partners || []).filter(p => p.status === 'active').map((partner) => (
                                    <SelectItem key={partner.id} value={partner.id}>
                                        {partner.name} - {partner.category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleAssign} disabled={!selectedPartnerId}>Gán đối tác</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Note Dialog */}
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm ghi chú nội bộ</DialogTitle>
                        <DialogDescription>
                            Ghi chú sẽ chỉ hiển thị cho admin, không hiển thị cho khách hàng.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Nhập ghi chú..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleAddNote} disabled={!adminNote.trim()}>Thêm ghi chú</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
