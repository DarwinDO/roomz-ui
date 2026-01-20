/**
 * Post Room Page
 * For landlords to post new room listings
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  Home,
  MapPin,
  DollarSign,
  Ruler,
  Users,
  Wifi,
  ParkingCircle,
  WashingMachine,
  AirVent,
  Loader2,
  CheckCircle,
  ImagePlus,
  X,
  Bed,
  Bath,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { createRoom, type CreateRoomData } from "@/services/rooms";
import { toast } from "sonner";

export default function PostRoomPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    district: "",
    city: "Hà Nội",
    pricePerMonth: "",
    depositAmount: "",
    areaSqm: "",
    bedroomCount: "1",
    bathroomCount: "1",
    maxOccupants: "1",
    roomType: "phong_tro" as const,
    furnished: false,
    availableFrom: "",
    minLeaseTerm: "3",
    // Amenities
    wifi: true,
    airConditioning: false,
    parking: false,
    washingMachine: false,
    refrigerator: false,
    heater: false,
    securityCamera: false,
    balcony: false,
  });

  // Image state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addImageUrl = () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      setImageUrls((prev) => [...prev, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng phòng");
      navigate("/login");
      return;
    }

    // Validation
    if (!formData.title || !formData.address || !formData.pricePerMonth) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);
    try {
      const roomData: CreateRoomData = {
        landlordId: user.id,
        title: formData.title,
        description: formData.description || undefined,
        address: formData.address,
        district: formData.district || undefined,
        city: formData.city,
        pricePerMonth: parseFloat(formData.pricePerMonth),
        depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : undefined,
        areaSqm: formData.areaSqm ? parseFloat(formData.areaSqm) : undefined,
        bedroomCount: parseInt(formData.bedroomCount) || 1,
        bathroomCount: parseInt(formData.bathroomCount) || 1,
        maxOccupants: parseInt(formData.maxOccupants) || 1,
        roomType: formData.roomType,
        furnished: formData.furnished,
        availableFrom: formData.availableFrom || undefined,
        minLeaseTerm: parseInt(formData.minLeaseTerm) || 3,
        amenities: {
          wifi: formData.wifi,
          air_conditioning: formData.airConditioning,
          parking: formData.parking,
          washing_machine: formData.washingMachine,
          refrigerator: formData.refrigerator,
          heater: formData.heater,
          security_camera: formData.securityCamera,
          balcony: formData.balcony,
        },
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };

      const room = await createRoom(roomData);
      setCreatedRoomId(room.id);
      setIsSuccess(true);
      toast.success("Đăng phòng thành công!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể đăng phòng. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Đăng phòng thành công!</h2>
            <p className="text-gray-600 mb-6">
              Phòng của bạn đã được đăng và đang chờ duyệt. Chúng tôi sẽ thông báo khi phòng được phê duyệt.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/landlord")}
              >
                Quản lý phòng
              </Button>
              {createdRoomId && (
                <Button
                  className="flex-1"
                  onClick={() => navigate(`/room/${createdRoomId}`)}
                >
                  Xem phòng
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vui lòng đăng nhập</h2>
            <p className="text-gray-600 mb-6">Bạn cần đăng nhập để đăng phòng cho thuê.</p>
            <Button onClick={() => navigate("/login")}>Đăng nhập</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Đăng phòng cho thuê</h1>
            <p className="text-sm text-gray-500">Bước {step} / 3</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>Mô tả phòng của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Tiêu đề tin đăng *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="VD: Phòng trọ cao cấp gần ĐH Bách Khoa"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Mô tả chi tiết</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Mô tả về phòng, tiện ích xung quanh, quy định..."
                  className="mt-2 min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="roomType">Loại phòng</Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(v) => handleInputChange("roomType", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phong_tro">Phòng trọ</SelectItem>
                    <SelectItem value="chung_cu_mini">Chung cư mini</SelectItem>
                    <SelectItem value="nha_nguyen_can">Nhà nguyên căn</SelectItem>
                    <SelectItem value="can_ho">Căn hộ</SelectItem>
                    <SelectItem value="o_ghep">Ở ghép</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Địa chỉ *</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Số nhà, đường"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="district">Quận/Huyện</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange("district", e.target.value)}
                    placeholder="VD: Cầu Giấy"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="city">Thành phố</Label>
                <Select
                  value={formData.city}
                  onValueChange={(v) => handleInputChange("city", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                    <SelectItem value="Hồ Chí Minh">Hồ Chí Minh</SelectItem>
                    <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Tiếp tục
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Details & Pricing */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Chi tiết & Giá cả
              </CardTitle>
              <CardDescription>Thông tin về phòng và giá thuê</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerMonth">Giá thuê/tháng (VNĐ) *</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="pricePerMonth"
                      type="number"
                      value={formData.pricePerMonth}
                      onChange={(e) => handleInputChange("pricePerMonth", e.target.value)}
                      placeholder="3000000"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="depositAmount">Tiền cọc (VNĐ)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) => handleInputChange("depositAmount", e.target.value)}
                    placeholder="3000000"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="areaSqm">Diện tích (m²)</Label>
                  <div className="relative mt-2">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="areaSqm"
                      type="number"
                      value={formData.areaSqm}
                      onChange={(e) => handleInputChange("areaSqm", e.target.value)}
                      placeholder="25"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bedroomCount">Phòng ngủ</Label>
                  <div className="relative mt-2">
                    <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="bedroomCount"
                      type="number"
                      value={formData.bedroomCount}
                      onChange={(e) => handleInputChange("bedroomCount", e.target.value)}
                      min="1"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bathroomCount">Phòng tắm</Label>
                  <div className="relative mt-2">
                    <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="bathroomCount"
                      type="number"
                      value={formData.bathroomCount}
                      onChange={(e) => handleInputChange("bathroomCount", e.target.value)}
                      min="1"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxOccupants">Số người tối đa</Label>
                  <div className="relative mt-2">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="maxOccupants"
                      type="number"
                      value={formData.maxOccupants}
                      onChange={(e) => handleInputChange("maxOccupants", e.target.value)}
                      min="1"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="minLeaseTerm">Thời hạn thuê tối thiểu (tháng)</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="minLeaseTerm"
                      type="number"
                      value={formData.minLeaseTerm}
                      onChange={(e) => handleInputChange("minLeaseTerm", e.target.value)}
                      min="1"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="availableFrom">Ngày có thể vào ở</Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => handleInputChange("availableFrom", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium">Có nội thất</p>
                  <p className="text-sm text-gray-500">Phòng được trang bị nội thất cơ bản</p>
                </div>
                <Switch
                  checked={formData.furnished}
                  onCheckedChange={(v) => handleInputChange("furnished", v)}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Quay lại
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Tiếp tục
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Amenities & Images */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-primary" />
                Tiện nghi & Hình ảnh
              </CardTitle>
              <CardDescription>Thêm tiện nghi và ảnh phòng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amenities */}
              <div>
                <Label className="mb-3 block">Tiện nghi</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "wifi", icon: Wifi, label: "WiFi" },
                    { key: "airConditioning", icon: AirVent, label: "Điều hòa" },
                    { key: "parking", icon: ParkingCircle, label: "Chỗ đỗ xe" },
                    { key: "washingMachine", icon: WashingMachine, label: "Máy giặt" },
                  ].map(({ key, icon: Icon, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData[key as keyof typeof formData]
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() =>
                        handleInputChange(key, !formData[key as keyof typeof formData])
                      }
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          formData[key as keyof typeof formData]
                            ? "text-primary"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <Label className="mb-3 block">Hình ảnh phòng</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Dán URL hình ảnh..."
                      className="flex-1"
                    />
                    <Button onClick={addImageUrl} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Thêm
                    </Button>
                  </div>
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {imageUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={url}
                            alt={`Ảnh ${i + 1}`}
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(url)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Thêm ít nhất 3 ảnh để tăng độ tin cậy cho tin đăng
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Quay lại
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang đăng...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Đăng phòng
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
