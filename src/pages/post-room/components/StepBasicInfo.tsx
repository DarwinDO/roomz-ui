import { useEffect, useState } from "react";
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
import { Home, MapPin, Loader2 } from "lucide-react";
import type { PostRoomFormData } from "../types";
import { getProvinces, getDistricts, type Province, type District } from "@/services/vietnamLocations";

interface StepBasicInfoProps {
    formData: PostRoomFormData;
    handleInputChange: (field: string, value: string | boolean) => void;
    onNext: () => void;
}

export function StepBasicInfo({ formData, handleInputChange, onNext }: StepBasicInfoProps) {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);

    // Load provinces on mount
    useEffect(() => {
        loadProvinces();
    }, []);

    // Load districts when city changes
    useEffect(() => {
        if (formData.city && selectedProvinceCode) {
            loadDistrictsForCity(selectedProvinceCode, formData.city);
        }
    }, [formData.city, selectedProvinceCode]);

    const loadProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const data = await getProvinces();
            setProvinces(data);
        } catch (error) {
            console.error("Failed to load provinces:", error);
        } finally {
            setLoadingProvinces(false);
        }
    };

    const loadDistrictsForCity = async (provinceCode: number, provinceName: string) => {
        setLoadingDistricts(true);
        try {
            const data = await getDistricts(provinceCode, provinceName);
            setDistricts(data);
        } catch (error) {
            console.error("Failed to load districts:", error);
            setDistricts([]);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const handleCityChange = (cityName: string) => {
        // Find province code
        const province = provinces.find(p => p.name === cityName);
        if (province) {
            setSelectedProvinceCode(province.code);
        }

        // Update form data
        handleInputChange("city", cityName);

        // Clear district when city changes
        handleInputChange("district", "");
    };

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

                {/* City Selection */}
                <div>
                    <Label htmlFor="city" className="text-base font-medium">Tỉnh/Thành phố <span className="text-destructive">*</span></Label>
                    <Select
                        value={formData.city}
                        onValueChange={handleCityChange}
                        disabled={loadingProvinces}
                    >
                        <SelectTrigger className="mt-2 rounded-xl h-11">
                            {loadingProvinces ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Đang tải...</span>
                                </div>
                            ) : (
                                <SelectValue placeholder="Chọn tỉnh/thành phố" />
                            )}
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {provinces.map((province) => (
                                <SelectItem key={province.code} value={province.name}>
                                    {province.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* District Selection - Cascading */}
                <div>
                    <Label htmlFor="district" className="text-base font-medium">Quận/Huyện</Label>
                    {formData.city ? (
                        <Select
                            value={formData.district}
                            onValueChange={(v) => handleInputChange("district", v)}
                            disabled={loadingDistricts || districts.length === 0}
                        >
                            <SelectTrigger className="mt-2 rounded-xl h-11">
                                {loadingDistricts ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang tải...</span>
                                    </div>
                                ) : districts.length === 0 ? (
                                    <SelectValue placeholder="Không có dữ liệu quận/huyện" />
                                ) : (
                                    <SelectValue placeholder="Chọn quận/huyện" />
                                )}
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {districts.map((district) => (
                                    <SelectItem key={district.code} value={district.name}>
                                        {district.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            id="district"
                            value={formData.district}
                            onChange={(e) => handleInputChange("district", e.target.value)}
                            placeholder="Chọn tỉnh/thành phố trước"
                            className="mt-2 rounded-xl h-11"
                            disabled
                        />
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5">
                        {formData.city && districts.length === 0 && !loadingDistricts
                            ? "Hoặc nhập thủ công nếu không tìm thấy"
                            : "Chọn từ danh sách hoặc nhập thủ công"}
                    </p>
                </div>

                {/* Address */}
                <div>
                    <Label htmlFor="address" className="text-base font-medium">Địa chỉ cụ thể <span className="text-destructive">*</span></Label>
                    <div className="relative mt-2">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="Số nhà, tên đường..."
                            className="pl-10 rounded-xl h-11"
                        />
                    </div>
                </div>

                <Button onClick={onNext} className="w-full rounded-xl h-12 text-base font-medium transition-all hover:scale-[1.02]">
                    Tiếp tục
                </Button>
            </CardContent>
        </Card>
    );
}
