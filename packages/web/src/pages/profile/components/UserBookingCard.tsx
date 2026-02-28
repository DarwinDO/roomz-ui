import { useNavigate } from "react-router-dom";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Home, XCircle, MessageCircle, User } from "lucide-react";
import type { BookingWithDetails } from "@/services/bookings";

interface UserBookingCardProps {
    booking: BookingWithDetails;
    onCancel?: () => void;
}

export function UserBookingCard({ booking, onCancel }: UserBookingCardProps) {
    const navigate = useNavigate();

    // Parse date and time from booking_date (stored as ISO timestamp)
    const parsedDate = booking.booking_date ? parseISO(booking.booking_date) : null;
    const bookingDateStr = parsedDate
        ? format(parsedDate, "EEEE, dd/MM/yyyy", { locale: vi })
        : "Chưa xác định";
    const bookingTimeStr = parsedDate
        ? format(parsedDate, "HH:mm")
        : null;

    const timeAgo = booking.created_at
        ? formatDistanceToNow(parseISO(booking.created_at), { addSuffix: true, locale: vi })
        : "";

    const landlordName = booking.landlord?.full_name || "Chủ nhà";

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge className="bg-warning/10 text-warning border-warning/20">Chờ xác nhận</Badge>;
            case "confirmed":
                return <Badge className="bg-success/10 text-success border-success/20">Đã xác nhận</Badge>;
            case "completed":
                return <Badge className="bg-info/10 text-info border-info/20">Hoàn thành</Badge>;
            case "cancelled":
                return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className="overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 border border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {bookingDateStr}
                        </CardTitle>
                        {bookingTimeStr && bookingTimeStr !== "00:00" && (
                            <CardDescription className="flex items-center gap-1.5 text-sm mt-1">
                                <Clock className="w-3.5 h-3.5" />
                                Lúc {bookingTimeStr}
                            </CardDescription>
                        )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                        {getStatusBadge(booking.status as string)}
                        <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {/* Room Info */}
                {booking.room && (
                    <div
                        className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors border border-border/50"
                        onClick={() => navigate(`/room/${booking.room?.id}`)}
                    >
                        {booking.room.room_images?.[0] ? (
                            <img
                                src={booking.room.room_images[0].image_url}
                                alt={booking.room.title}
                                className="w-14 h-14 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                                <Home className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{booking.room.title}</p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {booking.room.address}
                            </p>
                        </div>
                    </div>
                )}

                {/* Landlord Info */}
                <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Chủ nhà</p>
                        <p className="font-medium">{landlordName}</p>
                    </div>
                </div>

                {/* Note */}
                {booking.note && (
                    <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                        <p className="text-sm text-foreground/80 italic">
                            <MessageCircle className="w-3.5 h-3.5 inline-block mr-2 text-secondary" />
                            "{booking.note}"
                        </p>
                    </div>
                )}

                {/* Actions */}
                {booking.status === "pending" && onCancel && (
                    <div className="pt-2">
                        <Button
                            variant="outline"
                            className="w-full rounded-xl h-10 border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                            onClick={onCancel}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Hủy lịch hẹn
                        </Button>
                    </div>
                )}

                {/* Status Messages */}
                {booking.status === "confirmed" && (
                    <div className="bg-success/5 border border-success/10 rounded-xl p-3">
                        <p className="text-xs text-success font-medium">
                            ✓ Chủ nhà đã xác nhận. Hãy đến đúng giờ nhé!
                        </p>
                    </div>
                )}
                {booking.status === "cancelled" && (
                    <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-3">
                        <p className="text-xs text-destructive">
                            Lịch hẹn đã bị hủy
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
