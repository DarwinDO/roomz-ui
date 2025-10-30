import { useState } from "react";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  ArrowLeft,
  Heart,
  Share2,
  Calendar,
  MapPin,
  CheckCircle2,
  Wifi,
  Utensils,
  Tv,
  Wind,
  ShieldCheck,
  Star,
  MessageCircle,
} from "lucide-react";

export interface SubletDetailPageProps {
  onBack: () => void;
  onBookSublet: () => void;
  onMessageHost: () => void;
  sublet: {
    id: string;
    title: string;
    location: string;
    price: number;
    distance: string;
    verified: boolean;
    image: string;
    available?: boolean;
    matchPercentage?: number;
  };
}

const SubletDetailPage: FC<SubletDetailPageProps> = ({
  onBack,
  onBookSublet,
  onMessageHost,
  sublet,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = [
    sublet.image,
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwNjM4MzA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc2MDYzODMwN3ww&ixlib=rb-4.1.0&q=80&w=1080",
  ];

  const amenities = [
    { icon: Wifi, label: "WiFi tốc độ cao" },
    { icon: Utensils, label: "Bếp đầy đủ dụng cụ" },
    { icon: Tv, label: "Smart TV" },
    { icon: Wind, label: "Điều hòa & máy sưởi" },
  ];

  const hostInfo = {
    name: "Mai Chi",
    rating: 4.9,
    reviews: 28,
    trustScore: 98,
    role: "Sinh viên năm 3, Kinh tế",
  };

  const formatMonthlyPrice = (price: number) => {
    if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(1)}tr`;
    }
    return `${Math.round(price / 1_000)}k`;
  };

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-24">
      {/* Header with Back, Favorite, Share */}
      <div className="sticky top-0 z-20 bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
              className="rounded-full"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Image Gallery */}
        <div className="bg-black">
          <div className="relative w-full aspect-[4/3] md:aspect-video">
            <ImageWithFallback
              src={images[currentImageIndex]}
              alt={sublet.title}
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
                className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
                  index === currentImageIndex
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
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-6 space-y-6">
          {/* Title and Location */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="mb-2">{sublet.title}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <p className="text-sm">{sublet.location}</p>
                </div>
              </div>
              {sublet.verified && (
                <Badge className="bg-primary/10 text-primary border-0">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Đã xác thực
                </Badge>
              )}
            </div>

            {/* Price and Availability */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-primary">{formatMonthlyPrice(sublet.price)}</h2>
                <span className="text-gray-600">/tháng</span>
              </div>
              <Badge variant="outline" className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Lịch trống: {sublet.distance}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <h3 className="mb-3">Giới thiệu về chỗ ở</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Không gian lý tưởng cho kỳ thực tập hoặc học hè! Phòng riêng ấm cúng này có đủ mọi tiện nghi
              cho thời gian lưu trú ngắn hạn: giường rộng rãi, bàn làm việc và tủ quần áo. Chỉ mất vài phút đi bộ
              tới khuôn viên trường, trạm xe buýt, siêu thị và những quán cà phê yêu thích. Bạn sẽ ở cùng hai bạn
              sinh viên thân thiện, tôn trọng nếp sinh hoạt chung.
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="mb-4">Tiện nghi nổi bật</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {amenities.map((amenity, index) => {
                const Icon = amenity.icon;
                return (
                  <div
                    key={index}
                    className="bg-white border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm">{amenity.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Host Information */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
            <h3 className="mb-4">Chủ nhà</h3>
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xl">
                  {hostInfo.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{hostInfo.name}</p>
                  <Badge className="bg-secondary text-white text-xs">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {hostInfo.trustScore}% tin cậy
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{hostInfo.role}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{hostInfo.rating}</span>
                  </div>
                  <span className="text-gray-500">{hostInfo.reviews} đánh giá</span>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm mb-1">An toàn trên hết</p>
                <p className="text-xs text-gray-700">
                  Hãy gặp trực tiếp và kiểm tra giấy tờ trước khi thanh toán. RoomZ hỗ trợ quy trình thanh toán
                  an toàn cho các tin đăng đã được xác thực.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA - với padding cho mobile để không bị che bởi BottomNav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-3 md:px-6 z-50 mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col xs:flex-row gap-3">
            <Button
              onClick={onMessageHost}
              variant="outline"
              className="flex-1 rounded-full h-12 border-2 border-primary text-primary hover:bg-primary/10"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Nhắn chủ nhà
            </Button>
            <Button
              onClick={onBookSublet}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12 text-white shadow-md"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Đặt chỗ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubletDetailPage;
