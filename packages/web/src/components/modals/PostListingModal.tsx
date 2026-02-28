import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, MapPin, DollarSign, Users, Maximize, Camera } from "lucide-react";

interface PostListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function PostListingModal({ isOpen, onClose, onSubmit }: PostListingModalProps) {
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const roomTypes = [
    { id: "private", label: "Phòng riêng" },
    { id: "shared", label: "Phòng chung" },
    { id: "studio", label: "Căn studio" },
    { id: "apartment", label: "Nguyên căn" },
  ];

  const amenities = [
    "WiFi",
    "Điều hòa",
    "Nóng lạnh",
    "Tủ lạnh",
    "Máy giặt",
    "Bếp",
    "Ban công",
    "Thang máy",
    "Bảo vệ 24/7",
    "Cho phép thú cưng",
  ];

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = () => {
    // TODO: Implement API call to create listing
    onSubmit();
    onClose();
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
              Tiêu đề tin đăng
            </Label>
            <Input
              id="listing-title"
              placeholder="Ví dụ: Phòng trọ ấm cúng gần trường Đại học Bách Khoa"
              className="rounded-xl"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ
            </Label>
            <Input
              id="location"
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, thành phố"
              className="rounded-xl"
            />
          </div>

          {/* Room Type */}
          <div className="space-y-2">
            <Label>Loại phòng</Label>
            <div className="flex flex-wrap gap-2">
              {roomTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant={selectedRoomType === type.id ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm ${
                    selectedRoomType === type.id
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => setSelectedRoomType(type.id)}
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
                Giá thuê (VNĐ/tháng)
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="3000000"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area" className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-primary" />
                Diện tích (m²)
              </Label>
              <Input
                id="area"
                type="number"
                placeholder="25"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity" className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Số người ở tối đa
            </Label>
            <Select>
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
                  key={amenity}
                  variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                  className={`cursor-pointer px-3 py-1.5 text-xs ${
                    selectedAmenities.includes(amenity)
                      ? "bg-secondary text-white"
                      : "hover:bg-secondary/10"
                  }`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
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
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Hình ảnh phòng
            </Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Nhấp để tải ảnh lên hoặc kéo thả vào đây
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG tối đa 10MB (Tối thiểu 3 ảnh)
              </p>
            </div>
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
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12 text-white"
            >
              <Home className="w-5 h-5 mr-2" />
              Đăng tin
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

