/**
 * EditSubletPage
 * Edit existing sublet listing
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Home,
    CheckCircle,
    Clock,
    ChevronRight,
    Loader2,
    Edit,
    Calendar,
    DollarSign,
    FileText,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { useSublet, useUpdateSublet } from "@/hooks/useSublets";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function EditSubletPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const { data: sublet, isLoading, error } = useSublet(id);
    const updateSublet = useUpdateSublet();

    const [formData, setFormData] = useState({
        description: "",
        sublet_price: 0,
        start_date: "",
        end_date: "",
        status: "active" as "active" | "cancelled",
    });
    const [isSuccess, setIsSuccess] = useState(false);

    // Pre-fill form when sublet loads
    useEffect(() => {
        if (sublet) {
            setFormData({
                description: sublet.description || "",
                sublet_price: sublet.sublet_price || 0,
                start_date: sublet.start_date || "",
                end_date: sublet.end_date || "",
                status: (sublet.status as "active" | "cancelled") || "active",
            });
        }
    }, [sublet]);

    const handleInputChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!id || !user) {
            toast.error("Không thể cập nhật tin đăng");
            return;
        }

        // Validation
        if (!formData.start_date || !formData.end_date) {
            toast.error("Vui lòng chọn ngày bắt đầu và kết thúc");
            return;
        }

        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);

        if (endDate <= startDate) {
            toast.error("Ngày kết thúc phải sau ngày bắt đầu");
            return;
        }

        if (formData.sublet_price <= 0) {
            toast.error("Vui lòng nhập giá thuê hợp lệ");
            return;
        }

        try {
            await updateSublet.mutateAsync({
                id,
                updates: {
                    description: formData.description,
                    sublet_price: formData.sublet_price,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    status: formData.status,
                },
            });

            setIsSuccess(true);
            toast.success("Đã cập nhật tin đăng thành công!");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không thể cập nhật tin đăng";
            toast.error(message);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Đang tải dữ liệu tin đăng...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !sublet) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <Card className="max-w-md w-full shadow-lg border-none">
                    <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Home className="w-10 h-10 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Không tìm thấy tin đăng</h2>
                        <p className="text-muted-foreground mb-8">
                            {error instanceof Error ? error.message : "Tin đăng không tồn tại hoặc đã bị xóa"}
                        </p>
                        <Button onClick={() => navigate("/my-sublets")} className="w-full max-w-xs rounded-xl h-12">
                            Quay về Tin đăng của tôi
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Check ownership
    if (sublet.owner_id !== user?.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <Card className="max-w-md w-full shadow-lg border-none">
                    <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Home className="w-10 h-10 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Không có quyền truy cập</h2>
                        <p className="text-muted-foreground mb-8">Bạn không phải chủ sở hữu của tin đăng này</p>
                        <Button onClick={() => navigate("/my-sublets")} className="w-full max-w-xs rounded-xl h-12">
                            Quay về Tin đăng của tôi
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 animate-fade-in">
                <Card className="max-w-md w-full shadow-lg border-none">
                    <CardContent className="pt-12 pb-10 text-center">
                        <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                            <CheckCircle className="w-12 h-12 text-success" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Cập nhật thành công!</h2>

                        <div className="bg-warning/5 border border-warning/20 rounded-xl p-5 mb-6 text-left shadow-sm">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-warning-foreground">Tin đăng đã được cập nhật</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Thay đổi của bạn đã được lưu. Tin đăng sẽ hiển thị với thông tin mới.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl border-primary/20 hover:bg-primary/5 text-primary"
                                onClick={() => navigate("/my-sublets")}
                            >
                                <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    <span>Quản lý tin đăng</span>
                                </div>
                            </Button>
                            <Button
                                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20"
                                onClick={() => navigate(`/sublet/${id}`)}
                            >
                                <span>Xem tin đăng</span>
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3 transition-all">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <Edit className="w-4 h-4 text-primary" />
                            Chỉnh sửa tin đăng
                        </h1>
                        <p className="text-sm text-muted-foreground">{sublet.room?.title || "Phòng cho thuê"}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <Card className="shadow-sm">
                    <CardContent className="p-6 space-y-6">
                        {/* Room Info (read-only) */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h3 className="font-medium mb-2">Thông tin phòng (không thể sửa)</h3>
                            <p className="text-sm text-muted-foreground">{sublet.room?.title}</p>
                            <p className="text-sm text-muted-foreground">
                                {sublet.room?.address}, {sublet.room?.district}, {sublet.room?.city}
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Mô tả
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Mô tả chi tiết về phòng, tiện nghi, lý do cho thuê..."
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <Label htmlFor="price" className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Giá cho thuê (VNĐ/tháng) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                min={0}
                                value={formData.sublet_price}
                                onChange={(e) => handleInputChange("sublet_price", parseInt(e.target.value) || 0)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Giá gốc: {sublet.original_price?.toLocaleString("vi-VN")} VNĐ/tháng
                            </p>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate" className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Ngày bắt đầu <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate" className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Ngày kết thúc <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Trạng thái tin đăng</Label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => handleInputChange("status", e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="active">Đang hoạt động</option>
                                <option value="cancelled">Đã kết thúc</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={updateSublet.isPending}
                                className="flex-1 bg-primary hover:bg-primary/90"
                            >
                                {updateSublet.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    "Lưu thay đổi"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
