/**
 * MapModal — Modal hiển thị bản đồ vị trí phòng
 * Dùng cho mobile hoặc khi cần xem map fullscreen
 */
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapboxRoomMap } from "@/components/maps";
import type { RoomWithDetails } from "@/services/rooms";
import { MapPin, X, Navigation } from "lucide-react";

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: RoomWithDetails | null;
}

export function MapModal({ isOpen, onClose, room }: MapModalProps) {
    // Generate Google Maps directions URL
    const getDirectionsUrl = () => {
        if (!room?.latitude || !room?.longitude) return "#";
        const destination = `${room.latitude},${room.longitude}`;
        return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    };

    const locationText = room
        ? [room.address, room.district, room.city].filter(Boolean).join(", ")
        : "";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <DialogTitle className="text-lg">Vị trí trên bản đồ</DialogTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full h-8 w-8"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    {locationText && (
                        <DialogDescription className="text-left mt-1">
                            {locationText}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Map Container */}
                <div className="flex-1 relative min-h-0">
                    {room ? (
                        <MapboxRoomMap
                            rooms={[room]}
                            singleRoom
                            interactive
                            className="h-full rounded-none border-0"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-muted/30">
                            <p className="text-muted-foreground">Không có dữ liệu phòng</p>
                        </div>
                    )}
                </div>

                {/* Bottom Actions */}
                <div className="px-4 py-3 border-t border-border shrink-0 bg-card">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 rounded-xl"
                        >
                            Đóng
                        </Button>
                        {room?.latitude && room?.longitude && (
                            <Button
                                onClick={() => window.open(getDirectionsUrl(), "_blank")}
                                className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                            >
                                <Navigation className="w-4 h-4 mr-2" />
                                Chỉ đường
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
