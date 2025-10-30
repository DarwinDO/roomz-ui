import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { X, ChevronLeft, ChevronRight, Eye, Maximize2 } from "lucide-react";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export function GalleryModal({ isOpen, onClose, images, initialIndex = 0 }: GalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [is360View, setIs360View] = useState(false);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/95 backdrop-blur-xl border-0 rounded-3xl overflow-hidden" aria-describedby={undefined}>
        {/* Accessibility - Hidden Title and Description */}
        <VisuallyHidden>
          <DialogTitle>Thư viện ảnh</DialogTitle>
          <DialogDescription>
            Xem ảnh phòng. Sử dụng phím mũi tên hoặc nút để chuyển ảnh. Ảnh {currentIndex + 1} / {images.length}.
          </DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
                {currentIndex + 1} / {images.length}
              </Badge>
              {is360View && (
                <Badge className="bg-primary/90 text-white backdrop-blur-sm border-0">
                  <Eye className="w-3 h-3 mr-1" />
                  Chế độ 360° đang bật
                </Badge>
              )}
            </div>
            <Button
              onClick={onClose}
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Image */}
        <div className="relative w-full h-full flex items-center justify-center p-4 pt-20 pb-32">
          <div className="relative max-w-6xl max-h-full w-full h-full flex items-center justify-center">
            <ImageWithFallback
              src={images[currentIndex]}
              alt={`Room view ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-2xl"
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  onClick={handlePrevious}
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-foreground shadow-lg w-12 h-12"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  onClick={handleNext}
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-foreground shadow-lg w-12 h-12"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/60 to-transparent">
          {/* Action Buttons */}
          <div className="flex justify-center gap-2 mb-4">
            <Button
              onClick={() => setIs360View(!is360View)}
              variant="secondary"
              size="sm"
              className={`rounded-full backdrop-blur-sm ${
                is360View
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-white/90 hover:bg-white text-foreground"
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Xem 360°
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full bg-white/90 hover:bg-white text-foreground backdrop-blur-sm"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Toàn màn hình
            </Button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2 mx-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden transition-all ${
                    index === currentIndex
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-black scale-105"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Keyboard Navigation Hint */}
        <div className="absolute bottom-4 left-4 text-white/60 text-xs hidden md:block">
          Dùng phím ← → để chuyển ảnh
        </div>
      </DialogContent>
    </Dialog>
  );
}
