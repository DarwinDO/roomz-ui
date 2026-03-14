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

    const parsedDate = booking.booking_date ? parseISO(booking.booking_date) : null;
    const bookingDateStr = parsedDate
        ? format(parsedDate, "EEEE, dd/MM/yyyy", { locale: vi })
        : "Chưa xác định";
    const bookingTimeStr = parsedDate ? format(parsedDate, "HH:mm") : null;

    const timeAgo = booking.created_at
        ? formatDistanceToNow(parseISO(booking.created_at), { addSuffix: true, locale: vi })
        : "";

    const hostName = booking.landlord?.full_name || "Host";

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge className="border-warning/20 bg-warning/10 text-warning">Chờ xác nhận</Badge>;
            case "confirmed":
                return <Badge className="border-success/20 bg-success/10 text-success">Đã xác nhận</Badge>;
            case "completed":
                return <Badge className="border-info/20 bg-info/10 text-info">Hoàn thành</Badge>;
            case "cancelled":
                return <Badge className="border-destructive/20 bg-destructive/10 text-destructive">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className="overflow-hidden border border-border shadow-soft transition-all duration-300 hover:shadow-soft-lg">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5 pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Calendar className="h-4 w-4 text-primary" />
                            {bookingDateStr}
                        </CardTitle>
                        {bookingTimeStr && bookingTimeStr !== "00:00" && (
                            <CardDescription className="mt-1 flex items-center gap-1.5 text-sm">
                                <Clock className="h-3.5 w-3.5" />
                                Lúc {bookingTimeStr}
                            </CardDescription>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                        {getStatusBadge(booking.status as string)}
                        <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {booking.room && (
                    <div
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-muted/40 p-3 transition-colors hover:bg-muted/70"
                        onClick={() => navigate(`/room/${booking.room?.id}`)}
                    >
                        {booking.room.room_images?.[0] ? (
                            <img
                                src={booking.room.room_images[0].image_url}
                                alt={booking.room.title}
                                className="h-14 w-14 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                                <Home className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{booking.room.title}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {booking.room.address}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Host</p>
                        <p className="font-medium">{hostName}</p>
                    </div>
                </div>

                {booking.note && (
                    <div className="rounded-xl border border-secondary/10 bg-secondary/5 p-3">
                        <p className="text-sm italic text-foreground/80">
                            <MessageCircle className="mr-2 inline-block h-3.5 w-3.5 text-secondary" />
                            "{booking.note}"
                        </p>
                    </div>
                )}

                {booking.status === "pending" && onCancel && (
                    <div className="pt-2">
                        <Button
                            variant="outline"
                            className="h-10 w-full rounded-xl border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                            onClick={onCancel}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Hủy lịch hẹn
                        </Button>
                    </div>
                )}

                {booking.status === "confirmed" && (
                    <div className="rounded-xl border border-success/10 bg-success/5 p-3">
                        <p className="text-xs font-medium text-success">
                            ✓ Host đã xác nhận. Hãy đến đúng giờ nhé.
                        </p>
                    </div>
                )}
                {booking.status === "cancelled" && (
                    <div className="rounded-xl border border-destructive/10 bg-destructive/5 p-3">
                        <p className="text-xs text-destructive">Lịch hẹn đã bị hủy</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
