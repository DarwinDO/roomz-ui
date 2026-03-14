import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

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
  }, [handleNext, handlePrevious, isOpen, onClose]);

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[95vh] w-full max-w-[95vw] overflow-hidden rounded-3xl border-0 bg-black/95 p-0 backdrop-blur-xl" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Thư viện ảnh</DialogTitle>
          <DialogDescription>
            Xem ảnh chỗ ở. Sử dụng phím mũi tên hoặc các nút điều hướng để chuyển ảnh. Ảnh {currentIndex + 1} / {images.length}.
          </DialogDescription>
        </VisuallyHidden>

        <div className="absolute left-0 right-0 top-0 z-50 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-white/20 text-white backdrop-blur-sm">
                {currentIndex + 1} / {images.length}
              </Badge>
              {is360View ? (
                <Badge className="border-0 bg-primary/90 text-white backdrop-blur-sm">
                  <Eye className="mr-1 h-3 w-3" />
                  Chế độ 360° đang bật
                </Badge>
              ) : null}
            </div>
            <Button
              onClick={onClose}
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="relative flex h-full w-full items-center justify-center p-4 pb-32 pt-20">
          <div className="relative flex h-full w-full max-h-full max-w-6xl items-center justify-center">
            <ImageWithFallback
              src={images[currentIndex]}
              alt={`Ảnh chỗ ở ${currentIndex + 1}`}
              className="max-h-full max-w-full rounded-2xl object-contain"
            />

            {images.length > 1 ? (
              <>
                <Button
                  onClick={handlePrevious}
                  size="icon"
                  className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleNext}
                  size="icon"
                  className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="mb-4 flex justify-center gap-2">
            <Button
              onClick={() => setIs360View(!is360View)}
              variant="secondary"
              size="sm"
              className={`rounded-full backdrop-blur-sm ${
                is360View
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-white/90 text-foreground hover:bg-white"
              }`}
            >
              <Eye className="mr-2 h-4 w-4" />
              Xem 360°
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full bg-white/90 text-foreground backdrop-blur-sm hover:bg-white"
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              Toàn màn hình
            </Button>
          </div>

          <div className="scrollbar-hide flex justify-center gap-2 overflow-x-auto pb-2">
            <div className="mx-auto flex gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg transition-all ${
                    index === currentIndex
                      ? "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-black"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`Ảnh thu nhỏ ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 hidden text-xs text-white/60 md:block">
          Dùng phím ← → để chuyển ảnh
        </div>
      </DialogContent>
    </Dialog>
  );
}
