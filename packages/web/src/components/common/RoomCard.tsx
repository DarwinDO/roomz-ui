import { Badge } from "@/components/ui/badge";
import { Heart, MapPin } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { formatPriceInMillions } from "@roomz/shared/utils/format";

interface RoomCardProps {
  id: string;
  image: string;
  title: string;
  location: string;
  price: number;
  distance?: string;
  verified: boolean;
  available: boolean;
  matchPercentage?: number;
  isFavorited?: boolean;
  showFavoriteButton?: boolean;
  isSublet?: boolean;
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
  isSublet = false,
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
      className="bg-card rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden cursor-pointer hover-lift border border-border"
      onClick={() => onClick?.(id)}>
      <div className="relative">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-48 object-cover"
        />
        {showFavoriteButton && (
          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full p-2.5 shadow-md hover:scale-110 hover:bg-card transition-all duration-200 z-10"
            aria-label={localFavorited ? "Bỏ yêu thích" : "Thêm yêu thích"}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${localFavorited ? "fill-destructive text-destructive" : "text-muted-foreground"
                }`}
            />
          </button>
        )}
        {verified && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground shadow-sm">
            Verified+
          </Badge>
        )}
        {isSublet && (
          <Badge className="absolute bottom-3 left-3 bg-accent text-accent-foreground shadow-sm">
            Cho thuê ngắn hạn
          </Badge>
        )}
        {matchPercentage && (
          <Badge className="absolute bottom-3 right-3 bg-secondary text-secondary-foreground shadow-sm">
            {matchPercentage}% phù hợp
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-card-foreground mb-1 line-clamp-1">{title}</h3>
        <div className="flex items-center gap-1 text-muted-foreground mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
          {distance && <span className="text-sm">• {distance}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-primary font-semibold">{formatPriceInMillions(price)}tr</span>
            <span className="text-sm text-muted-foreground">/tháng</span>
          </div>
          {available && (
            <Badge variant="outline" className="border-secondary text-secondary">
              Còn trống
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
