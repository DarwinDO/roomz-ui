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

  useEffect(() => {
    setLocalFavorited(isFavoritedProp);
  }, [isFavoritedProp]);

  const handleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation();
    setLocalFavorited(!localFavorited);
    onFavorite?.(id);
  };

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
      onClick={() => onClick?.(id)}
    >
      <div className="relative">
        <ImageWithFallback src={image} alt={title} className="h-48 w-full object-cover" />
        {showFavoriteButton ? (
          <button
            onClick={handleFavorite}
            className="absolute right-3 top-3 z-10 rounded-full bg-card/90 p-2.5 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-card"
            aria-label={localFavorited ? "Bỏ yêu thích" : "Thêm yêu thích"}
          >
            <Heart className={`h-5 w-5 transition-colors ${localFavorited ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
          </button>
        ) : null}
        {verified ? <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground shadow-sm">Verified+</Badge> : null}
        {isSublet ? <Badge className="absolute bottom-3 left-3 bg-accent text-accent-foreground shadow-sm">Ở ngắn hạn</Badge> : null}
        {matchPercentage ? <Badge className="absolute bottom-3 right-3 bg-secondary text-secondary-foreground shadow-sm">{matchPercentage}% phù hợp</Badge> : null}
      </div>
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 font-medium text-card-foreground">{title}</h3>
        <div className="mb-2 flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{location}</span>
          {distance ? <span className="text-sm">• {distance}</span> : null}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-primary">{formatPriceInMillions(price)}tr</span>
            <span className="text-sm text-muted-foreground">/tháng</span>
          </div>
          {available ? (
            <Badge variant="outline" className="border-secondary text-secondary">
              Còn trống
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
