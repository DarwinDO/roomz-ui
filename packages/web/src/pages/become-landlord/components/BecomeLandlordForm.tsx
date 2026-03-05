import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Building2, MapPin, FileText, CheckCircle, Loader2 } from "lucide-react";
import type { BecomeLandlordFormData } from "../types";

interface BecomeLandlordFormProps {
    formData: BecomeLandlordFormData;
    setFormData: React.Dispatch<React.SetStateAction<BecomeLandlordFormData>>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
}

export function BecomeLandlordForm({ formData, setFormData, handleSubmit, isSubmitting }: BecomeLandlordFormProps) {
    return (
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm animate-fade-in-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    Thông tin đăng ký
                </CardTitle>
                <CardDescription>
                    Điền thông tin để chúng tôi xác minh và kích hoạt tài khoản chủ trọ
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2 font-medium">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                Số điện thoại liên hệ <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="0912 345 678"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                className="h-11 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="propertyCount" className="flex items-center gap-2 font-medium">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                Số lượng phòng/căn hộ <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="propertyCount"
                                type="number"
                                placeholder="Ví dụ: 5"
                                min="1"
                                value={formData.propertyCount}
                                onChange={(e) => setFormData({ ...formData, propertyCount: e.target.value })}
                                required
                                className="h-11 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2 font-medium">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            Địa chỉ tài sản chính <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="address"
                            placeholder="Số nhà, đường, quận/huyện, thành phố"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                            className="h-11 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="experience" className="font-medium">Kinh nghiệm cho thuê</Label>
                        <Input
                            id="experience"
                            placeholder="Ví dụ: 3 năm quản lý chuỗi phòng trọ..."
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            className="h-11 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-medium">Mô tả thêm (tùy chọn)</Label>
                        <Textarea
                            id="description"
                            placeholder="Mô tả về quy mô, đối tượng khách hàng mục tiêu hoặc thông tin bổ sung khác..."
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[100px] rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Đang gửi hồ sơ...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Gửi đơn đăng ký
                                </>
                            )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            Bằng việc gửi đơn, bạn đồng ý với <a href="#" className="underline hover:text-primary">Điều khoản sử dụng</a> của RommZ dành cho đối tác.
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
