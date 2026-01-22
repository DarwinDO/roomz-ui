/**
 * Post Room Page
 * For landlords to post new room listings
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
  Camera,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { createRoom, type CreateRoomData } from "@/services/rooms";
import { uploadMultipleRoomImages } from "@/services/roomImages";
import { toast } from "sonner";

export default function PostRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    roomType: "private" as const,
    furnished: false,
    availableFrom: "",
    minLeaseTerm: "1",
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} không phải là file ảnh`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`${file.name} vượt quá 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      
      // Create preview URLs
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrls(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    const input = fileInputRef.current;
    if (input) {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      input.files = dt.files;
      handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
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
      let imageUrls: string[] = [];
      
      // Upload images if any
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        setUploadProgress(0);
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
          imageUrls = await uploadMultipleRoomImages(user.id, selectedFiles);
          setUploadedUrls(imageUrls);
        } catch (uploadErr) {
          clearInterval(progressInterval);
          const message = uploadErr instanceof Error ? uploadErr.message : "Không thể tải ảnh lên";
          toast.error(message);
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setIsUploading(false);
      }

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
        minLeaseTerm: parseInt(formData.minLeaseTerm) || 1,
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
                    <SelectItem value="private">Phòng riêng</SelectItem>
                    <SelectItem value="shared">Ở ghép</SelectItem>
                    <SelectItem value="studio">Căn hộ mini/Studio</SelectItem>
                    <SelectItem value="entire">Nhà nguyên căn</SelectItem>
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
                  <Label htmlFor="minLeaseTerm">Thuê tối thiểu (tháng)</Label>
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

              {/* Images Upload */}
              <div>
                <Label className="mb-3 block">Hình ảnh phòng</Label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                    isUploading
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <p className="font-medium mb-1">
                    {isUploading ? "Đang tải lên..." : "Chọn hoặc kéo thả ảnh"}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, tối đa 5MB/ảnh
                  </p>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Đang tải ảnh...</span>
                      <span className="text-primary">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Preview Grid */}
                {previewUrls.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Đã chọn {selectedFiles.length} ảnh
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isSubmitting}
                      >
                        <ImagePlus className="w-4 h-4 mr-1" />
                        Thêm ảnh
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                          {!isUploading && !isSubmitting && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary text-white text-xs rounded">
                              Ảnh đại diện
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-3">
                  Thêm ít nhất 3 ảnh để tăng độ tin cậy cho tin đăng
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={isSubmitting}>
                  Quay lại
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading}
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
