import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, MapPin, DollarSign, Users, Maximize, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TablesInsert } from "@/lib/database.types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PostListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

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

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((a) => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng tin");
      return;
    }

    // Check if user is landlord
    if (profile?.role !== "landlord") {
      toast.error("Bạn cần trở thành chủ nhà để đăng tin");
      navigate("/become-landlord");
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.location || !formData.roomType || !formData.price || !formData.area) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setLoading(true);
    try {
      // Insert room
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({
          landlord_id: user.id,
          title: formData.title,
          description: formData.description || null,
          room_type: formData.roomType as TablesInsert<'rooms'>['room_type'],
          address: formData.location,
          price_per_month: parseInt(formData.price),
          area_sqm: parseInt(formData.area) || null,
          max_occupants: formData.capacity ? parseInt(formData.capacity) : null,
          status: 'pending',
        } as TablesInsert<'rooms'>)
        .select()
        .single();

      if (roomError) throw roomError;

      // Insert amenities
      const amenityData = {
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
      };

      const { error: amenityError } = await supabase
        .from("room_amenities")
        .insert(amenityData as TablesInsert<'room_amenities'>);

      if (amenityError) {
        console.error("Error inserting amenities:", amenityError);
        // Don't throw - room was created successfully
      }

      toast.success("Tin đăng đã được tạo! Vui lòng chờ admin phê duyệt.");
      onSubmit();

      // Reset form
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
      onClose();
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Lỗi khi tạo tin đăng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng tin cho thuê phòng</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết về phòng của bạn để bắt đầu tìm kiếm người thuê phù hợp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="listing-title" className="flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              Tiêu đề tin đăng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="listing-title"
              placeholder="Ví dụ: Phòng trọ ấm cúng gần trường Đại học Bách Khoa"
              className="rounded-xl"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, thành phố"
              className="rounded-xl"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {/* Room Type */}
          <div className="space-y-2">
            <Label>Loại phòng <span className="text-red-500">*</span></Label>
            <div className="flex flex-wrap gap-2">
              {roomTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant={formData.roomType === type.id ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm ${formData.roomType === type.id
                    ? "bg-primary text-white"
                    : "hover:bg-primary/10"
                    }`}
                  onClick={() => setFormData({ ...formData, roomType: type.id })}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Price and Area */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Giá thuê (VNĐ/tháng) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="3000000"
                className="rounded-xl"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area" className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-primary" />
                Diện tích (m²) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="area"
                type="number"
                placeholder="25"
                className="rounded-xl"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity" className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Số người ở tối đa
            </Label>
            <Select
              value={formData.capacity}
              onValueChange={(value) => setFormData({ ...formData, capacity: value })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn số người" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 người</SelectItem>
                <SelectItem value="2">2 người</SelectItem>
                <SelectItem value="3">3 người</SelectItem>
                <SelectItem value="4">4 người</SelectItem>
                <SelectItem value="5">5+ người</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Tiện nghi</Label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <Badge
                  key={amenity.id}
                  variant={selectedAmenities.includes(amenity.id) ? "default" : "outline"}
                  className={`cursor-pointer px-3 py-1.5 text-xs ${selectedAmenities.includes(amenity.id)
                    ? "bg-secondary text-white"
                    : "hover:bg-secondary/10"
                    }`}
                  onClick={() => toggleAmenity(amenity.id)}
                >
                  {amenity.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              placeholder="Giới thiệu về phòng trọ, khu vực xung quanh, quy định chung, v.v..."
              className="rounded-xl min-h-32"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              💡 <strong>Lưu ý:</strong> Tin đăng của bạn sẽ được xem xét và phê duyệt trong vòng 24 giờ.
              Phòng có xác thực Verified+ sẽ được ưu tiên hiển thị.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-full h-12"
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12 text-white"
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
