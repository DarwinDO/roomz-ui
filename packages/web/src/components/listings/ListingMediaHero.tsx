import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Camera, Images } from "lucide-react";

interface ListingMediaBadge {
  id?: string;
  label: ReactNode;
  className?: string;
}

interface ListingMediaHeroProps {
  images: string[];
  title: string;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  topLeftBadges?: ListingMediaBadge[];
  topRightBadges?: ListingMediaBadge[];
  bottomRightActions?: ReactNode;
  emptyStateText?: string;
  galleryLabel?: string;
}

export function ListingMediaHero({
  images,
  title,
  currentIndex,
  onIndexChange,
  topLeftBadges = [],
  topRightBadges = [],
  bottomRightActions,
  emptyStateText = "Chưa có ảnh",
  galleryLabel = "Xem tất cả ảnh",
}: ListingMediaHeroProps) {
  const imageCountLabel = images.length > 0 ? `${currentIndex + 1} / ${images.length}` : "0 / 0";

  return (
    <div className="bg-black">
      <div className="relative aspect-[4/3] w-full md:aspect-video">
        {images[currentIndex] ? (
          <ImageWithFallback src={images[currentIndex]} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            {emptyStateText}
          </div>
        )}

        {topLeftBadges.length ? (
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {topLeftBadges.map((badge, index) => (
              <Badge key={badge.id ?? index} className={badge.className}>
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : null}

        {topRightBadges.length ? (
          <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
            {topRightBadges.map((badge, index) => (
              <Badge key={badge.id ?? index} className={badge.className}>
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {images.length ? (
            <Badge className="border-0 bg-black/70 text-white backdrop-blur-sm">
              <Camera className="mr-1.5 h-3.5 w-3.5" />
              {imageCountLabel}
            </Badge>
          ) : null}
          {bottomRightActions ?? (
            images.length ? (
              <Button className="rounded-xl bg-white/95 text-foreground hover:bg-white">
                <Images className="mr-2 h-4 w-4" />
                {galleryLabel}
              </Button>
            ) : null
          )}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-1 p-2 md:grid-cols-6 md:gap-2 md:p-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              onClick={() => onIndexChange(index)}
              className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
                index === currentIndex ? "ring-2 ring-primary ring-offset-2 ring-offset-black" : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              <ImageWithFallback src={image} alt={`Ảnh ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
