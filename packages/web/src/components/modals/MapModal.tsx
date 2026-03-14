import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapboxRoomMap } from "@/components/maps";
import type { RoomWithDetails } from "@/services/rooms";
import { MapPin, Navigation, X } from "lucide-react";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomWithDetails | null;
}

export function MapModal({ isOpen, onClose, room }: MapModalProps) {
  const getDirectionsUrl = () => {
    if (!room?.latitude || !room?.longitude) return "#";
    return `https://www.google.com/maps/dir/?api=1&destination=${room.latitude},${room.longitude}`;
  };

  const locationText = room ? [room.address, room.district, room.city].filter(Boolean).join(", ") : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[85vh] w-[95vw] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg">Vị trí trên bản đồ</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {locationText ? <DialogDescription className="mt-1 text-left">{locationText}</DialogDescription> : null}
        </DialogHeader>

        <div className="relative min-h-0 flex-1">
          {room ? (
            <MapboxRoomMap rooms={[room]} singleRoom interactive className="h-full rounded-none border-0" />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted/30">
              <p className="text-muted-foreground">Không có dữ liệu vị trí cho tin đăng này.</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-card px-4 py-3">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Đóng
            </Button>
            {room?.latitude && room?.longitude ? (
              <Button onClick={() => window.open(getDirectionsUrl(), "_blank")}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90">
                <Navigation className="mr-2 h-4 w-4" />
                Chỉ đường
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
