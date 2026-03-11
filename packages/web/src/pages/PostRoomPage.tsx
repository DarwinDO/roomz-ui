import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Home,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2,
  Edit,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { createRoom, getRoomById, updateRoomWithData, type CreateRoomData, type UpdateRoomData } from "@/services/rooms";
import { uploadMultipleRoomImages } from "@/services/roomImages";
import { geocodeRoomLocation, normalizeRoomLocationInput } from "@/services/mapboxGeocoding";
import { toast } from "sonner";
import type { PostRoomFormData } from "./post-room/types";

// Step Components
import { StepBasicInfo } from "./post-room/components/StepBasicInfo";
import { StepDetailsPricing } from "./post-room/components/StepDetailsPricing";
import { StepAmenitiesImages } from "./post-room/components/StepAmenitiesImages";

export default function PostRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);

  // Edit mode states
  const editRoomId = searchParams.get("edit");
  const isEditMode = !!editRoomId;
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [originalLocation, setOriginalLocation] = useState<{
    address: string;
    district: string;
    city: string;
  } | null>(null);

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
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  // Load room data for edit mode
  useEffect(() => {
    async function loadRoomData() {
      if (!editRoomId || !user) return;

      setIsLoadingRoom(true);
      setLoadError(null);

      try {
        const room = await getRoomById(editRoomId);

        if (!room) {
          setLoadError("Không tìm thấy phòng");
          return;
        }

        // Check if user is the landlord
        if (room.landlord_id !== user.id) {
          setLoadError("Bạn không có quyền chỉnh sửa phòng này");
          return;
        }

        // Populate form with room data
        setFormData({
          title: room.title || "",
          description: room.description || "",
          address: room.address || "",
          district: room.district || "",
          city: room.city || "Hà Nội",
          pricePerMonth: room.price_per_month?.toString() || "",
          depositAmount: room.deposit_amount?.toString() || "",
          areaSqm: room.area_sqm?.toString() || "",
          bedroomCount: room.bedroom_count?.toString() || "1",
          bathroomCount: room.bathroom_count?.toString() || "1",
          maxOccupants: room.max_occupants?.toString() || "1",
          roomType: (room.room_type as 'private' | 'shared' | 'studio' | 'entire') || "private",
          furnished: room.furnished || false,
          availableFrom: room.available_from || "",
          minLeaseTerm: "1",
          // Amenities from room_amenities
          wifi: room.amenities?.wifi || false,
          airConditioning: room.amenities?.air_conditioning || false,
          parking: room.amenities?.parking || false,
          washingMachine: room.amenities?.washing_machine || false,
          refrigerator: room.amenities?.refrigerator || false,
          heater: room.amenities?.heater || false,
          securityCamera: room.amenities?.security_camera || false,
          balcony: room.amenities?.balcony || false,
        });
        setOriginalLocation({
          address: room.address || "",
          district: room.district || "",
          city: room.city || "Hà Nội",
        });

        // Load existing images
        if (room.images && room.images.length > 0) {
          const urls = room.images.map(img => img.image_url);
          setExistingImageUrls(urls);
          setPreviewUrls(urls);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải dữ liệu phòng";
        setLoadError(message);
      } finally {
        setIsLoadingRoom(false);
      }
    }

    loadRoomData();
  }, [editRoomId, user]);

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
    // Check if this is an existing image or a new file
    const existingCount = existingImageUrls.length;

    if (index < existingCount) {
      // Remove existing image
      setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove new file
      const fileIndex = index - existingCount;
      setSelectedFiles(prev => prev.filter((_, i) => i !== fileIndex));
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    }
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
      const normalizedLocationInput = normalizeRoomLocationInput({
        address: formData.address,
        district: formData.district,
        city: formData.city,
      });
      const hasLocationChanged = !originalLocation || (
        normalizedLocationInput.address !== normalizeRoomLocationInput(originalLocation).address
        || (normalizedLocationInput.district || "") !== (normalizeRoomLocationInput(originalLocation).district || "")
        || (normalizedLocationInput.city || "") !== (normalizeRoomLocationInput(originalLocation).city || "")
      );

      let geocodedLocation = null;
      try {
        geocodedLocation = await geocodeRoomLocation(normalizedLocationInput);
      } catch (geocodeError) {
        console.warn("Failed to geocode room location:", geocodeError);
      }

      if (!geocodedLocation && (!isEditMode || hasLocationChanged)) {
        toast.warning("Không thể xác định tọa độ chính xác. Tin đăng vẫn được lưu nhưng sẽ chưa được ưu tiên trong tìm kiếm theo vị trí.");
      }

      let newImageUrls: string[] = [];

      // Upload new images if any
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
          newImageUrls = await uploadMultipleRoomImages(user.id, selectedFiles);
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

      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      if (isEditMode && editRoomId) {
        // UPDATE existing room
        const updateData: UpdateRoomData = {
          title: formData.title,
          description: formData.description || undefined,
          address: normalizedLocationInput.address,
          district: geocodedLocation?.district || normalizedLocationInput.district || undefined,
          city: geocodedLocation?.city || normalizedLocationInput.city || formData.city,
          latitude: geocodedLocation?.latitude ?? (hasLocationChanged ? null : undefined),
          longitude: geocodedLocation?.longitude ?? (hasLocationChanged ? null : undefined),
          pricePerMonth: parseFloat(formData.pricePerMonth),
          depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : undefined,
          areaSqm: formData.areaSqm ? parseFloat(formData.areaSqm) : undefined,
          bedroomCount: parseInt(formData.bedroomCount) || 1,
          bathroomCount: parseInt(formData.bathroomCount) || 1,
          maxOccupants: parseInt(formData.maxOccupants) || 1,
          roomType: formData.roomType,
          furnished: formData.furnished,
          availableFrom: formData.availableFrom || undefined,
          // If room was rejected, resubmit as pending
          status: 'pending',
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
        };

        await updateRoomWithData(editRoomId, updateData);
        setCreatedRoomId(editRoomId);
        setIsSuccess(true);
        toast.success("Cập nhật phòng thành công! Đang chờ duyệt lại.");
      } else {
        // CREATE new room
        const roomData: CreateRoomData = {
          landlordId: user.id,
          title: formData.title,
          description: formData.description || undefined,
          address: normalizedLocationInput.address,
          district: geocodedLocation?.district || normalizedLocationInput.district || undefined,
          city: geocodedLocation?.city || normalizedLocationInput.city || formData.city,
          latitude: geocodedLocation?.latitude,
          longitude: geocodedLocation?.longitude,
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
          imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
        };

        const room = await createRoom(roomData);
        setCreatedRoomId(room.id);
        setIsSuccess(true);
        toast.success("Đăng phòng thành công!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể lưu phòng. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state for edit mode
  if (isEditMode && isLoadingRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu phòng...</p>
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-lg border-none">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Không thể tải phòng</h2>
            <p className="text-muted-foreground mb-8">{loadError}</p>
            <Button onClick={() => navigate("/landlord")} className="w-full max-w-xs rounded-xl h-12">
              Quay về Quản lý phòng
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 animate-fade-in">
        <Card className="max-w-md w-full shadow-lg border-none">
          <CardContent className="pt-12 pb-10 text-center">
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {isEditMode ? "Cập nhật thành công!" : "Đăng phòng thành công!"}
            </h2>

            {/* Pending approval notice */}
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-5 mb-6 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning-foreground">
                    {isEditMode ? "Phòng đang chờ duyệt lại" : "Phòng đang chờ phê duyệt"}
                  </p>
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
                  <span>Xem phòng vừa {isEditMode ? "cập nhật" : "đăng"}</span>
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
            <h1 className="text-lg font-bold flex items-center gap-2">
              {isEditMode && <Edit className="w-4 h-4 text-primary" />}
              {isEditMode ? "Chỉnh sửa phòng" : "Đăng phòng cho thuê"}
            </h1>
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
              isEditMode={isEditMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
