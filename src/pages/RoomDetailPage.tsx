import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Wifi,
  ParkingCircle,
  UtensilsCrossed,
  WashingMachine,
  ShieldCheck,
  Heart,
  Share2,
  CheckCircle,
  Eye,
  Camera,
  Images,
  CalendarCheck,
  Map,
  Tv,
  AirVent,
  Bed,
  Sofa,
  MessageCircle,
  Loader2,
  AlertCircle,
  Snowflake,
  Dumbbell,
  KeyRound,
  Video,
  Fence,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookViewingModal } from "@/components/modals/BookViewingModal";
import { ContactLandlordModal } from "@/components/modals/ContactLandlordModal";
import { GalleryModal } from "@/components/modals/GalleryModal";
import { ViewAllMatchesModal } from "@/components/modals/ViewAllMatchesModal";
import { RoommateProfileModal } from "@/components/modals/RoommateProfileModal";
import { ChatDrawer } from "@/components/common/ChatDrawer";
import { useRoom } from "@/hooks/useRooms";
import { useIsFavorited } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import { formatPriceInMillions } from "@/utils/format";

export default function RoomDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  // Fetch room data
  const { room, loading, error, refetch } = useRoom(id);
  
  // Favorite state
  const { isFavorited, toggle: toggleFavorite, loading: favoriteLoading } = useIsFavorited(id || '');

  const onBack = () => navigate(-1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [isContactLandlordOpen, setIsContactLandlordOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isViewAllMatchesOpen, setIsViewAllMatchesOpen] = useState(false);
  const [isRoommateProfileOpen, setIsRoommateProfileOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState<{ name: string; role: string; match: number } | null>(null);

  // Helper functions to manage mutually exclusive modals
  const closeAllModals = () => {
    setIsBookViewingOpen(false);
    setIsContactLandlordOpen(false);
    setIsGalleryOpen(false);
    setIsViewAllMatchesOpen(false);
    setIsRoommateProfileOpen(false);
    setIsChatDrawerOpen(false);
  };

  const openBookViewingModal = () => {
    closeAllModals();
    setIsBookViewingOpen(true);
  };

  const openContactLandlordModal = () => {
    closeAllModals();
    setIsContactLandlordOpen(true);
  };

  const openGalleryModal = () => {
    closeAllModals();
    setIsGalleryOpen(true);
  };

  const openViewAllMatchesModal = () => {
    closeAllModals();
    setIsViewAllMatchesOpen(true);
  };

  const openRoommateProfileModal = (roommate: { name: string; role: string; match: number }) => {
    setSelectedRoommate(roommate);
    closeAllModals();
    setIsRoommateProfileOpen(true);
  };

  const openChatDrawer = (roommate: { name: string; role: string; match: number }) => {
    setSelectedRoommate(roommate);
    closeAllModals();
    setIsChatDrawerOpen(true);
  };

  // Handle favorite toggle
  const handleFavoriteClick = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu phòng yêu thích");
      navigate('/login');
      return;
    }
    try {
      await toggleFavorite();
      toast.success(isFavorited ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích");
    } catch {
      toast.error("Không thể cập nhật yêu thích");
    }
  };

  // Get images from room data
  const images = useMemo(() => {
    if (!room?.images || room.images.length === 0) {
      return [
        "https://images.unsplash.com/photo-1668089677938-b52086753f77?w=800",
        "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800",
      ];
    }
    return room.images
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(img => img.image_url);
  }, [room?.images]);

  // Build amenities list from room data
  const amenities = useMemo(() => {
    if (!room?.amenities) return [];
    
    const amenityMap = [
      { key: 'wifi', icon: Wifi, label: 'WiFi tốc độ cao' },
      { key: 'parking', icon: ParkingCircle, label: 'Chỗ đỗ xe' },
      { key: 'kitchen', icon: UtensilsCrossed, label: 'Bếp chung' },
      { key: 'washing_machine', icon: WashingMachine, label: 'Giặt là' },
      { key: 'tv', icon: Tv, label: 'Smart TV' },
      { key: 'air_conditioning', icon: AirVent, label: 'Điều hòa' },
      { key: 'refrigerator', icon: Snowflake, label: 'Tủ lạnh' },
      { key: 'heater', icon: Snowflake, label: 'Máy sưởi' },
      { key: 'gym', icon: Dumbbell, label: 'Phòng gym' },
      { key: 'elevator', icon: Sofa, label: 'Thang máy' },
      { key: 'security_camera', icon: Video, label: 'Camera an ninh' },
      { key: 'security_guard', icon: ShieldCheck, label: 'Bảo vệ 24/7' },
      { key: 'fingerprint_lock', icon: KeyRound, label: 'Khóa vân tay' },
      { key: 'balcony', icon: Fence, label: 'Ban công' },
    ];

    return amenityMap.filter(item => {
      const value = room.amenities?.[item.key as keyof typeof room.amenities];
      return value === true;
    });
  }, [room?.amenities]);

  // Add furnished if applicable
  const displayAmenities = useMemo(() => {
    const list = [...amenities];
    if (room?.furnished) {
      list.unshift({ key: 'furnished', icon: Bed, label: 'Có nội thất' });
    }
    return list.slice(0, 8); // Limit to 8 items
  }, [amenities, room?.furnished]);

  // Mock roommates for now
  const roommates = [
    { name: "Minh Tuấn", match: 92, avatar: "", role: "CNTT, Năm 3" },
    { name: "Hương Giang", match: 88, avatar: "", role: "Kinh tế, Năm 2" },
    { name: "Đức Anh", match: 85, avatar: "", role: "Kỹ thuật, Cao học" },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy phòng</h2>
          <p className="text-gray-600 mb-6">{error || 'Phòng này không tồn tại hoặc đã bị xóa.'}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/search')} variant="default">
              Tìm kiếm phòng khác
            </Button>
            <Button onClick={() => refetch()} variant="outline">
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Format price
  const formattedPrice = formatPriceInMillions(Number(room.price_per_month));
  
  // Format location
  const location = [room.address, room.district, room.city].filter(Boolean).join(', ');
  
  // Landlord info
  const landlordName = room.landlord?.full_name || 'Chủ nhà';
  const landlordInitials = landlordName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={handleFavoriteClick}
              disabled={favoriteLoading}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Image Gallery */}
        <div className="bg-black">
        {/* Main Image */}
        <div className="relative w-full aspect-[4/3] md:aspect-video">
          <ImageWithFallback
            src={images[currentImageIndex]}
            alt={room.title}
            className="w-full h-full object-cover"
          />
          
          {/* Badge Overlays - Top Left */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {room.is_verified && (
              <Badge className="bg-white/95 text-primary backdrop-blur-sm border-0">
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Ảnh đã xác thực
              </Badge>
            )}
            {room.has_360_photos && (
              <Badge className="bg-primary/95 text-white backdrop-blur-sm border-0">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Xem 360°
              </Badge>
            )}
          </div>

          {/* Image Counter - Top Right */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Action Buttons - Bottom Right */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={openGalleryModal}
              className="rounded-full bg-white/95 hover:bg-white backdrop-blur-sm text-foreground shadow-lg min-h-[44px]"
            >
              <Images className="w-4 h-4 mr-2" />
              Xem thư viện
            </Button>
            <Button
              size="sm"
              onClick={openBookViewingModal}
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg min-h-[44px]"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Đặt lịch xem
            </Button>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-1 md:gap-2 p-2 md:p-3 bg-black">
            {images.slice(0, 4).map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
                  index === currentImageIndex
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-black"
                    : "opacity-60 hover:opacity-100 hover:ring-1 hover:ring-white/50"
                }`}
              >
                <ImageWithFallback
                  src={image}
                  alt={`Góc nhìn phòng ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Title & Location */}
            <div>
              <h1 className="mb-3">{room.title}</h1>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 rounded-full h-8"
                >
                  <Map className="w-3.5 h-3.5 mr-1.5" />
                  Xem bản đồ
                </Button>
              </div>
            </div>

            {/* Compact Info Bar */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-4 border border-primary/10">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1 text-primary">
                    <span className="text-2xl">{formattedPrice}tr</span>
                  </div>
                  <p className="text-xs text-gray-600">/tháng</p>
                </div>
                <div className="text-center border-l border-r border-border">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Calendar className="w-4 h-4 text-secondary" />
                    <span>{room.available_from ? new Date(room.available_from).toLocaleDateString('vi-VN') : 'Ngay'}</span>
                  </div>
                  <p className="text-xs text-gray-600">Có thể thuê từ</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <ShieldCheck className={`w-4 h-4 ${room.is_verified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={room.is_verified ? 'text-green-600' : 'text-gray-500'}>
                      {room.is_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{room.is_verified ? 'Giấy tờ + Ảnh' : ''}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="mb-3">Về phòng này</h3>
              <p className="text-gray-700 leading-relaxed">
                {room.description || `${room.title}. Diện tích ${room.area_sqm || 'N/A'}m², ${room.bedroom_count || 1} phòng ngủ, ${room.bathroom_count || 1} phòng tắm. Tối đa ${room.max_occupants || 1} người.`}
              </p>
              {room.deposit_amount && (
                <p className="text-sm text-gray-500 mt-2">
                  Đặt cọc: {formatPriceInMillions(Number(room.deposit_amount))}tr
                </p>
              )}
            </div>

            {/* Amenities */}
            {displayAmenities.length > 0 && (
              <div>
                <h3 className="mb-4">Tiện nghi</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {displayAmenities.map((amenity, index) => {
                    const Icon = amenity.icon;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors"
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs text-center">{amenity.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Landlord */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarImage src={room.landlord?.avatar_url || undefined} />
                  <AvatarFallback>{landlordInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p>{landlordName}</p>
                    {room.is_verified && (
                      <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Chủ nhà xác thực
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {room.landlord?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Điểm tin cậy:</span>
                <Progress value={room.is_verified ? 95 : 70} className="flex-1" />
                <span className="text-sm">{room.is_verified ? 95 : 70}%</span>
              </div>
            </div>
          </div>

          {/* Sidebar - Sticky on Desktop */}
          <div className="space-y-6 md:sticky md:top-20 md:self-start">
            {/* CTA Buttons */}
            <div className="space-y-3 bg-white rounded-2xl border border-border p-4 shadow-sm">
              <Button
                onClick={openBookViewingModal}
                className="w-full bg-primary hover:bg-primary/90 rounded-full h-12 min-h-[44px]"
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                Đặt lịch xem
              </Button>
              <Button
                onClick={openContactLandlordModal}
                variant="outline"
                className="w-full rounded-full h-12 min-h-[44px]"
              >
                Nhắn tin cho chủ nhà
              </Button>
            </div>

            {/* Roommate Matching */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h3>Bạn cùng phòng tiềm năng</h3>
                <Badge variant="outline" className="bg-white">
                  3 kết quả
                </Badge>
              </div>
              <div className="space-y-3">
                {roommates.map((roommate, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-3 border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                          {roommate.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{roommate.name}</p>
                        <p className="text-xs text-gray-500 truncate">{roommate.role}</p>
                      </div>
                      <Badge className="bg-secondary text-white shrink-0">
                        {roommate.match}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoommateProfileModal(roommate)}
                        className="rounded-full text-xs"
                      >
                        Xem hồ sơ
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openChatDrawer(roommate)}
                        className="rounded-full bg-primary hover:bg-primary/90 text-xs"
                      >
                        Nhắn tin
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={openViewAllMatchesModal}
                variant="outline"
                className="w-full mt-4 rounded-full border-primary text-primary hover:bg-primary hover:text-white min-h-[44px]"
              >
                Xem tất cả
              </Button>
            </div>

            {/* Safety Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm mb-1">An toàn trên hết</p>
                  <p className="text-xs text-gray-600">
                    Luôn gặp trực tiếp và xác minh tài sản trước khi thanh toán bất kỳ khoản nào.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Modals */}
      <BookViewingModal
        isOpen={isBookViewingOpen}
        onClose={() => setIsBookViewingOpen(false)}
      />
      <ContactLandlordModal
        isOpen={isContactLandlordOpen}
        onClose={() => setIsContactLandlordOpen(false)}
      />
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images}
        initialIndex={currentImageIndex}
      />
      <ViewAllMatchesModal
        isOpen={isViewAllMatchesOpen}
        onClose={() => setIsViewAllMatchesOpen(false)}
        onViewProfile={openRoommateProfileModal}
        onMessage={openChatDrawer}
      />
      {selectedRoommate && (
        <>
          <RoommateProfileModal
            isOpen={isRoommateProfileOpen}
            onClose={() => setIsRoommateProfileOpen(false)}
            onMessageClick={() => openChatDrawer(selectedRoommate)}
            roommate={selectedRoommate}
          />
          <ChatDrawer
            isOpen={isChatDrawerOpen}
            onClose={() => setIsChatDrawerOpen(false)}
            recipientName={selectedRoommate.name}
            recipientRole={selectedRoommate.role}
          />
        </>
      )}

      {/* Mobile Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 md:hidden bg-white z-40" style={{ boxShadow: '0 -2px 6px rgba(0,0,0,0.08)' }}>
        <div className="px-4 py-3 pb-[calc(0.75rem+16px)]">
          <div className="flex gap-3">
            <Button
              onClick={openContactLandlordModal}
              variant="outline"
              className="flex-1 rounded-full h-12 border-primary text-primary hover:bg-primary hover:text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Nhắn chủ nhà
            </Button>
            <Button
              onClick={openBookViewingModal}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Đặt lịch xem
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
