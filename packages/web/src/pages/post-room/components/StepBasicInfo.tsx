import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelectPopover } from "@/components/ui/form-select-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDistricts, getProvinces, type District, type Province } from "@/services/vietnamLocations";
import { Home, Loader2, MapPin } from "lucide-react";

import type { PostRoomFormData } from "../types";

interface StepBasicInfoProps {
  formData: PostRoomFormData;
  handleInputChange: (field: string, value: string | boolean) => void;
  onNext: () => void;
}

const ROOM_TYPE_OPTIONS = [
  { value: "private", label: "Phòng riêng" },
  { value: "shared", label: "Ở ghép" },
  { value: "studio", label: "Căn hộ mini/Studio" },
  { value: "entire", label: "Nhà nguyên căn" },
];

export function StepBasicInfo({
  formData,
  handleInputChange,
  onNext,
}: StepBasicInfoProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);

  useEffect(() => {
    void loadProvinces();
  }, []);

  useEffect(() => {
    if (!formData.city || !selectedProvinceCode) {
      return;
    }

    void loadDistrictsForCity(selectedProvinceCode, formData.city);
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
    const province = provinces.find((item) => item.name === cityName);

    if (province) {
      setSelectedProvinceCode(province.code);
    }

    handleInputChange("city", cityName);
    handleInputChange("district", "");
  };

  const provinceOptions = provinces.map((province) => ({
    value: province.name,
    label: province.name,
    keywords: `${province.name} ${province.code}`,
  }));

  const districtOptions = districts.map((district) => ({
    value: district.name,
    label: district.name,
    keywords: `${district.name} ${district.code}`,
  }));

  return (
    <Card className="animate-fade-in border border-border shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Home className="h-5 w-5 text-primary" />
          </div>
          Thông tin cơ bản
        </CardTitle>
        <CardDescription>
          Mô tả tổng quan về phòng của bạn để thu hút người thuê.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="title" className="text-base font-medium">
            Tiêu đề tin đăng <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(event) => handleInputChange("title", event.target.value)}
            placeholder="VD: Phòng trọ cao cấp full nội thất gần ĐH Bách Khoa"
            className="mt-2 h-11 rounded-xl"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-base font-medium">
            Mô tả chi tiết
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(event) => handleInputChange("description", event.target.value)}
            placeholder="Mô tả về phòng, tiện ích xung quanh, quy định giờ giấc..."
            className="mt-2 min-h-[120px] rounded-xl"
          />
        </div>

        <div>
          <Label htmlFor="roomType" className="text-base font-medium">
            Loại phòng
          </Label>
          <FormSelectPopover
            value={formData.roomType}
            onValueChange={(value) => handleInputChange("roomType", value)}
            options={ROOM_TYPE_OPTIONS}
            placeholder="Chọn loại phòng"
            className="mt-2 rounded-xl"
          />
        </div>

        <div>
          <Label htmlFor="city" className="text-base font-medium">
            Tỉnh/Thành phố <span className="text-destructive">*</span>
          </Label>
          {loadingProvinces ? (
            <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-input bg-input-background px-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang tải...</span>
            </div>
          ) : (
            <FormSelectPopover
              value={formData.city}
              onValueChange={handleCityChange}
              options={provinceOptions}
              placeholder="Chọn tỉnh/thành phố"
              searchable
              searchPlaceholder="Tìm tỉnh/thành phố..."
              className="mt-2 rounded-xl"
            />
          )}
        </div>

        <div>
          <Label htmlFor="district" className="text-base font-medium">
            Quận/Huyện
          </Label>
          {formData.city ? (
            loadingDistricts ? (
              <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-input bg-input-background px-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <FormSelectPopover
                value={formData.district}
                onValueChange={(value) => handleInputChange("district", value)}
                options={districtOptions}
                placeholder={
                  districtOptions.length === 0
                    ? "Không có dữ liệu quận/huyện"
                    : "Chọn quận/huyện"
                }
                searchable
                searchPlaceholder="Tìm quận/huyện..."
                disabled={districtOptions.length === 0}
                className="mt-2 rounded-xl"
              />
            )
          ) : (
            <Input
              id="district"
              value={formData.district}
              onChange={(event) => handleInputChange("district", event.target.value)}
              placeholder="Chọn tỉnh/thành phố trước"
              className="mt-2 h-11 rounded-xl"
              disabled
            />
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formData.city && districtOptions.length === 0 && !loadingDistricts
              ? "Hoặc nhập thủ công nếu không tìm thấy."
              : "Chọn từ danh sách để tránh lệch dữ liệu vị trí."}
          </p>
        </div>

        <div>
          <Label htmlFor="address" className="text-base font-medium">
            Địa chỉ cụ thể <span className="text-destructive">*</span>
          </Label>
          <div className="relative mt-2">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="address"
              value={formData.address}
              onChange={(event) => handleInputChange("address", event.target.value)}
              placeholder="Số nhà, tên đường..."
              className="h-11 rounded-xl pl-10"
            />
          </div>
        </div>

        <Button
          onClick={onNext}
          className="h-12 w-full rounded-xl text-base font-medium transition-all hover:scale-[1.02]"
        >
          Tiếp tục
        </Button>
      </CardContent>
    </Card>
  );
}
