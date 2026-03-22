import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DollarSign, Home, MapPin, Maximize, Users } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import type { TablesInsert } from "@/lib/database.types";
import { parseCurrencyInput } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSelectPopover } from "@/components/ui/form-select-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PostListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const roomTypes = [
  { id: "private", label: "Phòng riêng" },
  { id: "shared", label: "Phòng chung" },
  { id: "studio", label: "Căn studio" },
  { id: "entire", label: "Nguyên căn" },
];

const amenities = [
  { id: "wifi", label: "WiFi" },
  { id: "air_conditioning", label: "Điều hòa" },
  { id: "heater", label: "Nóng lạnh" },
  { id: "refrigerator", label: "Tủ lạnh" },
  { id: "washing_machine", label: "Máy giặt" },
  { id: "kitchen", label: "Bếp" },
  { id: "balcony", label: "Ban công" },
  { id: "elevator", label: "Thang máy" },
  { id: "security_guard", label: "Bảo vệ 24/7" },
];

const capacityOptions = [
  { value: "1", label: "1 người" },
  { value: "2", label: "2 người" },
  { value: "3", label: "3 người" },
  { value: "4", label: "4 người" },
  { value: "5", label: "5+ người" },
];

export function PostListingModal({ isOpen, onClose, onSubmit }: PostListingModalProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    roomType: "",
    price: "",
    area: "",
    capacity: "",
    description: "",
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((item) => item !== amenityId)
        : [...prev, amenityId],
    );
  };

  const resetForm = () => {
    setFormData({
      title: "",
      location: "",
      roomType: "",
      price: "",
      area: "",
      capacity: "",
      description: "",
    });
    setSelectedAmenities([]);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng tin");
      return;
    }

    if (profile?.role !== "landlord") {
      toast.error("Bạn cần trở thành host để đăng tin");
      navigate("/become-host");
      return;
    }

    if (
      !formData.title ||
      !formData.location ||
      !formData.roomType ||
      !formData.price ||
      !formData.area
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setLoading(true);

    try {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({
          landlord_id: user.id,
          title: formData.title,
          description: formData.description || null,
          room_type: formData.roomType as TablesInsert<"rooms">["room_type"],
          address: formData.location,
          price_per_month: parseCurrencyInput(formData.price),
          area_sqm: Number.parseInt(formData.area, 10) || null,
          max_occupants: formData.capacity ? Number.parseInt(formData.capacity, 10) : null,
          status: "pending",
        } as TablesInsert<"rooms">)
        .select()
        .single();

      if (roomError) {
        throw roomError;
      }

      const { error: amenityError } = await supabase.from("room_amenities").insert({
        room_id: room.id,
        wifi: selectedAmenities.includes("wifi"),
        air_conditioning: selectedAmenities.includes("air_conditioning"),
        heater: selectedAmenities.includes("heater"),
        refrigerator: selectedAmenities.includes("refrigerator"),
        washing_machine: selectedAmenities.includes("washing_machine"),
        kitchen: selectedAmenities.includes("kitchen"),
        balcony: selectedAmenities.includes("balcony"),
        elevator: selectedAmenities.includes("elevator"),
        security_guard: selectedAmenities.includes("security_guard"),
      } as TablesInsert<"room_amenities">);

      if (amenityError) {
        console.error("Error inserting amenities:", amenityError);
      }

      toast.success("Tin đăng đã được tạo. Hệ thống đang chờ admin phê duyệt.");
      onSubmit();
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating listing:", error);
      const message = error instanceof Error ? error.message : "Lỗi khi tạo tin đăng";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng tin cho thuê</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết về chỗ ở của bạn để bắt đầu tìm người thuê phù hợp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="listing-title" className="flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              Tiêu đề tin đăng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="listing-title"
              placeholder="Ví dụ: Phòng trọ ấm cúng gần trường Đại học Bách Khoa"
              className="rounded-xl"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Địa chỉ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, thành phố"
              className="rounded-xl"
              value={formData.location}
              onChange={(event) => setFormData({ ...formData, location: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Loại phòng <span className="text-red-500">*</span></Label>
            <div className="flex flex-wrap gap-2">
              {roomTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant={formData.roomType === type.id ? "default" : "outline"}
                  className={
                    formData.roomType === type.id
                      ? "cursor-pointer px-4 py-2 text-sm bg-primary text-white"
                      : "cursor-pointer px-4 py-2 text-sm hover:bg-primary/10"
                  }
                  onClick={() => setFormData({ ...formData, roomType: type.id })}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Giá thuê (VNĐ/tháng) <span className="text-red-500">*</span>
              </Label>
              <CurrencyInput
                id="price"
                placeholder="3.000.000"
                className="rounded-xl"
                value={formData.price}
                onValueChange={(value) => setFormData({ ...formData, price: value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area" className="flex items-center gap-2">
                <Maximize className="h-4 w-4 text-primary" />
                Diện tích (m²) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="area"
                type="number"
                placeholder="25"
                className="rounded-xl"
                value={formData.area}
                onChange={(event) => setFormData({ ...formData, area: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Số người ở tối đa
            </Label>
            <FormSelectPopover
              value={formData.capacity}
              onValueChange={(value) => setFormData({ ...formData, capacity: value })}
              options={capacityOptions}
              placeholder="Chọn số người"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Tiện nghi</Label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <Badge
                  key={amenity.id}
                  variant={selectedAmenities.includes(amenity.id) ? "default" : "outline"}
                  className={
                    selectedAmenities.includes(amenity.id)
                      ? "cursor-pointer px-3 py-1.5 text-xs bg-secondary text-white"
                      : "cursor-pointer px-3 py-1.5 text-xs hover:bg-secondary/10"
                  }
                  onClick={() => toggleAmenity(amenity.id)}
                >
                  {amenity.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              placeholder="Giới thiệu về phòng trọ, khu vực xung quanh, quy định chung và những lưu ý cần trao đổi thêm."
              className="min-h-32 rounded-xl"
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            />
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-gray-700">
              <strong>Lưu ý:</strong> Tin đăng của bạn sẽ được xem xét và phê duyệt trong vòng
              24 giờ. Phòng có xác thực Verified+ sẽ được ưu tiên hiển thị.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="h-12 flex-1 rounded-full"
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-12 flex-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng tin"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
