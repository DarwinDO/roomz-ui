import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, MapPin } from "lucide-react";
import type { PostRoomFormData } from "../types";

interface StepBasicInfoProps {
    formData: PostRoomFormData;
    handleInputChange: (field: string, value: string | boolean) => void;
    onNext: () => void;
}

export function StepBasicInfo({ formData, handleInputChange, onNext }: StepBasicInfoProps) {
    return (
        <Card className="shadow-soft animate-fade-in border border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Home className="w-5 h-5 text-primary" />
                    </div>
                    Thông tin cơ bản
                </CardTitle>
                <CardDescription>Mô tả tổng quan về phòng của bạn để thu hút người thuê</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="title" className="text-base font-medium">Tiêu đề tin đăng <span className="text-destructive">*</span></Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="VD: Phòng trọ cao cấp full nội thất gần ĐH Bách Khoa"
                        className="mt-2 rounded-xl h-11"
                    />
                </div>

                <div>
                    <Label htmlFor="description" className="text-base font-medium">Mô tả chi tiết</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Mô tả về phòng, tiện ích xung quanh, quy định giờ giấc..."
                        className="mt-2 min-h-[120px] rounded-xl"
                    />
                </div>

                <div>
                    <Label htmlFor="roomType" className="text-base font-medium">Loại phòng</Label>
                    <Select
                        value={formData.roomType}
                        onValueChange={(v) => handleInputChange("roomType", v)}
                    >
                        <SelectTrigger className="mt-2 rounded-xl h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="private">Phòng riêng</SelectItem>
                            <SelectItem value="shared">Ở ghép</SelectItem>
                            <SelectItem value="studio">Căn hộ mini/Studio</SelectItem>
                            <SelectItem value="entire">Nhà nguyên căn</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="address" className="text-base font-medium">Địa chỉ <span className="text-destructive">*</span></Label>
                        <div className="relative mt-2">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                                placeholder="Số nhà, đường"
                                className="pl-10 rounded-xl h-11"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="district" className="text-base font-medium">Quận/Huyện</Label>
                        <Input
                            id="district"
                            value={formData.district}
                            onChange={(e) => handleInputChange("district", e.target.value)}
                            placeholder="VD: Cầu Giấy"
                            className="mt-2 rounded-xl h-11"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="city" className="text-base font-medium">Thành phố</Label>
                    <Select
                        value={formData.city}
                        onValueChange={(v) => handleInputChange("city", v)}
                    >
                        <SelectTrigger className="mt-2 rounded-xl h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                            <SelectItem value="Hồ Chí Minh">Hồ Chí Minh</SelectItem>
                            <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={onNext} className="w-full rounded-xl h-12 text-base font-medium transition-all hover:scale-[1.02]">
                    Tiếp tục
                </Button>
            </CardContent>
        </Card>
    );
}
