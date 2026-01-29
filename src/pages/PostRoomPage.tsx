import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Home,
  CheckCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { createRoom, type CreateRoomData } from "@/services/rooms";
import { uploadMultipleRoomImages } from "@/services/roomImages";
import { toast } from "sonner";
import type { PostRoomFormData } from "./post-room/types";

// Step Components
import { StepBasicInfo } from "./post-room/components/StepBasicInfo";
import { StepDetailsPricing } from "./post-room/components/StepDetailsPricing";
import { StepAmenitiesImages } from "./post-room/components/StepAmenitiesImages";

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
  const [formData, setFormData] = useState<PostRoomFormData>({
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
    roomType: "private",
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
      handleFileSelect({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 animate-fade-in">
        <Card className="max-w-md w-full shadow-lg border-none">
          <CardContent className="pt-12 pb-10 text-center">
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Đăng phòng thành công!</h2>

            {/* Pending approval notice */}
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-5 mb-6 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning-foreground">Phòng đang chờ phê duyệt</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Admin sẽ xem xét và phê duyệt phòng của bạn trong vòng 24h.
                    Sau khi được duyệt, phòng sẽ hiển thị công khai trên trang tìm kiếm.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground text-sm mb-8">
              Theo dõi trạng thái phòng trong mục <strong>"Quản lý phòng"</strong> của bạn.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-primary/20 hover:bg-primary/5 text-primary"
                onClick={() => navigate("/landlord")}
              >
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>Quản lý phòng</span>
                </div>
              </Button>
              {createdRoomId && (
                <Button
                  className="w-full h-12 rounded-xl shadow-lg shadow-primary/20"
                  onClick={() => navigate(`/room/${createdRoomId}`)}
                >
                  <span>Xem phòng vừa đăng</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
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
        <Card className="max-w-md w-full shadow-lg border-none">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">Bạn cần đăng nhập tài khoản chủ nhà để có thể đăng phòng cho thuê.</p>
            <Button onClick={() => navigate("/login")} className="w-full max-w-xs rounded-xl h-12 shadow-lg shadow-primary/20">
              Đăng nhập ngay
            </Button>
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
            <h1 className="text-lg font-bold">Đăng phòng cho thuê</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Bước {step} / 3</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
              <span>{step === 1 ? "Thông tin cơ bản" : step === 2 ? "Chi tiết & Giá" : "Tiện nghi & Ảnh"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 px-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ease-out ${s <= step ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-muted"
                }`}
            />
          ))}
        </div>

        {/* Step Components */}
        <div className="min-h-[500px]">
          {step === 1 && (
            <StepBasicInfo
              formData={formData}
              handleInputChange={handleInputChange}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <StepDetailsPricing
              formData={formData}
              handleInputChange={handleInputChange}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <StepAmenitiesImages
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              onBack={() => setStep(2)}
              isSubmitting={isSubmitting}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              previewUrls={previewUrls}
              selectedFiles={selectedFiles}
              handleFileSelect={handleFileSelect}
              handleDrop={handleDrop}
              removeImage={removeImage}
              fileInputRef={fileInputRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}
