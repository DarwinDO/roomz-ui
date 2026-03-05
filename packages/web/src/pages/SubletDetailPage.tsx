import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { ContactLandlordModal } from "@/components/modals/ContactLandlordModal";
import { ApplySubletDialog } from "@/components/modals/ApplySubletDialog";
import { useSublet } from "@/hooks/useSublets";
import { useAuth } from "@/contexts";
import { formatMonthlyPrice } from "@roomz/shared/utils/format";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Heart,
  Share2,
  Calendar,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Star,
  MessageCircle,
  AlertCircle,
  Edit,
  Users,
  Info,
} from "lucide-react";

const SubletDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: sublet, isLoading, error } = useSublet(id);
  const { user } = useAuth();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const images = sublet?.images?.map((img) => img.image_url) || [];
  const room = sublet?.room;
  const owner = sublet?.owner;

  // Computed values from API data
  const title = room?.title || "Phòng cho thuê";
  const location = room ? `${room.address}, ${room.district}, ${room.city}` : "";
  const subletPrice = sublet?.sublet_price || 0;
  const dateRange = sublet
    ? `${format(new Date(sublet.start_date), 'dd/MM/yyyy')} - ${format(new Date(sublet.end_date), 'dd/MM/yyyy')}`
    : "";
  const isVerified = owner?.id_card_verified || false;
  const isOwner = !!(user?.id && owner?.id && user.id === owner.id);

  const handleBack = () => navigate(-1);
  const handleBookSublet = () => {
    setIsApplyOpen(true);
  };
  const handleMessageHost = () => {
    if (!owner?.id) {
      toast.error('Không thể nhắn tin. Thông tin chủ nhà không khả dụng.');
      return;
    }
    setIsContactOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-24 md:pb-24">
        <div className="sticky top-0 z-20 bg-white border-b px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="w-full aspect-[4/3] md:aspect-video" />
          <div className="px-4 md:px-6 py-6 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !sublet) {
    return (
      <div className="min-h-screen bg-white pb-24 md:pb-24 flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Không tìm thấy tin đăng</h2>
          <p className="text-gray-600">
            Tin đăng này có thể đã bị xóa hoặc không tồn tại.
          </p>
          <Button onClick={() => navigate(-1)} className="rounded-full">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-24">
      {/* Header with Back, Favorite, Share */}
      <div className="sticky top-0 z-20 bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled
              title="Coming soon"
              className="rounded-full"
            >
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" disabled title="Coming soon" className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Image Gallery */}
        <div className="bg-black">
          {images.length <= 1 ? (
            <div className="w-full aspect-[4/3] md:aspect-video overflow-hidden bg-muted">
              {images[0] ? (
                <ImageWithFallback
                  src={images[0]}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100">
                  <span className="text-sm">Không có ảnh</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="relative w-full aspect-[4/3] md:aspect-video">
                <ImageWithFallback
                  src={images[currentImageIndex] || ""}
                  alt={title}
                  className="w-full h-full object-cover"
                />

                {/* Image Counter */}
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-3 gap-1 md:gap-2 p-2 md:p-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Xem ảnh ${index + 1}`}
                    className={`relative aspect-video overflow-hidden rounded-lg transition-all ${index === currentImageIndex
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-black"
                      : "opacity-60 hover:opacity-100"
                      }`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`Góc nhìn ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-6 space-y-6">
          {/* Owner Banner */}
          {isOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Đây là tin đăng của bạn</p>
                <p className="text-xs text-blue-700">Bạn đang xem tin đăng của mình. Sử dụng các nút bên dưới để quản lý.</p>
              </div>
            </div>
          )}
          {/* Title and Location */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="mb-2">{title}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <p className="text-sm">{location}</p>
                </div>
              </div>
              {isVerified && (
                <Badge className="bg-primary/10 text-primary border-0">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Đã xác thực
                </Badge>
              )}
            </div>

            {/* Price and Availability */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-primary">
                  {formatMonthlyPrice(subletPrice)}
                </h2>
              </div>
              <Badge
                variant="outline"
                className="bg-gradient-to-br from-primary/5 to-secondary/5"
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Lịch trống: {dateRange}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <h3 className="mb-3">Giới thiệu về chỗ ở</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {sublet.description || "Chưa có mô tả."}
            </p>
          </div>

          {/* Host Information */}
          {owner && (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
              <h3 className="mb-4">Chủ nhà</h3>
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xl">
                    {owner.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{owner.full_name}</p>
                    {owner.id_card_verified && (
                      <Badge className="bg-secondary text-white text-xs">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Đã xác thực
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">Chủ phòng</span>
                  </div>
                  {!isOwner && (
                    <Button
                      onClick={handleMessageHost}
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-full border-primary text-primary hover:bg-primary/10"
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5" />
                      Nhắn chủ nhà
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Safety Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm mb-1">An toàn trên hết</p>
                <p className="text-xs text-gray-700">
                  Hãy gặp trực tiếp và kiểm tra giấy tờ trước khi thanh
                  toán. RommZ hỗ trợ quy trình thanh toán an toàn cho các
                  tin đăng đã được xác thực.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-2 md:px-6 z-50 mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto">
          {isOwner ? (
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(`/sublet/${id}/applications`)}
                variant="outline"
                className="flex-1 rounded-full h-11"
              >
                <Users className="w-5 h-5 mr-2" />
                Xem đơn đăng ký
              </Button>
              <Button
                onClick={() => navigate(`/sublet/${id}/edit`)}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-11 text-white shadow-md"
              >
                <Edit className="w-5 h-5 mr-2" />
                Chỉnh sửa tin đăng
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleBookSublet}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-11 text-white shadow-md"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Đăng ký thuê
            </Button>
          )}
        </div>
      </div>

      {/* Contact Landlord Modal - only for non-owners */}
      {!isOwner && owner && (
        <ContactLandlordModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          landlord={{
            id: owner.id,
            full_name: owner.full_name || "Chủ nhà",
            avatar_url: owner.avatar_url || null,
          }}
          roomId={sublet?.room?.id}
          roomTitle={sublet?.room?.title}
        />
      )}

      {/* Apply Sublet Dialog - only for non-owners */}
      {!isOwner && (
        <ApplySubletDialog
          sublet={sublet}
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
        />
      )}
    </div>
  );
};

export default SubletDetailPage;
