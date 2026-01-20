import { Badge } from "@/components/ui/badge";
import { Heart, MapPin } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { formatPriceInMillions } from "@/utils/format";

interface RoomCardProps {
  id: string;
  image: string;
  title: string;
  location: string;
  price: number;
  distance: string;
  verified: boolean;
  available: boolean;
  matchPercentage?: number;
  isFavorited?: boolean;
  showFavoriteButton?: boolean;
  onFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function RoomCard({
  id,
  image,
  title,
  location,
  price,
  distance,
  verified,
  available,
  matchPercentage,
  isFavorited: isFavoritedProp = false,
  showFavoriteButton = true,
  onFavorite,
  onClick,
}: RoomCardProps) {
  const [localFavorited, setLocalFavorited] = useState(isFavoritedProp);

  // Sync local state with prop when prop changes
  useEffect(() => {
    setLocalFavorited(isFavoritedProp);
  }, [isFavoritedProp]);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFavorited(!localFavorited);
    onFavorite?.(id);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <div className="relative">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-48 object-cover"
        />
        {showFavoriteButton && (
          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform z-10"
          >
            <Heart
              className={`w-5 h-5 ${
                localFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
        )}
        {verified && (
          <Badge className="absolute top-3 left-3 bg-primary text-white">
            Verified+
          </Badge>
        )}
        {matchPercentage && (
          <Badge className="absolute bottom-3 right-3 bg-secondary text-white">
            {matchPercentage}% phù hợp
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1">{title}</h3>
        <div className="flex items-center gap-1 text-gray-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
          <span className="text-sm">• {distance}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-primary">{formatPriceInMillions(price)}tr</span>
            <span className="text-sm text-gray-500">/tháng</span>
          </div>
          {available && (
            <Badge variant="outline" className="border-green-500 text-green-600">
              Còn trống
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
