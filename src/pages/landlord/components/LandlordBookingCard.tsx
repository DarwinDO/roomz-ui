import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, Eye, Phone, Mail, MessageCircle, Home } from "lucide-react";
import type { BookingWithDetails } from "@/services/bookings";

interface LandlordBookingCardProps {
    booking: BookingWithDetails;
    onConfirm?: () => void;
    onReject?: () => void;
    onComplete?: () => void;
    showActions?: boolean;
    showCompleteButton?: boolean;
}

export function LandlordBookingCard({
    booking,
    onConfirm,
    onReject,
    onComplete,
    showActions,
    showCompleteButton
}: LandlordBookingCardProps) {
    const navigate = useNavigate();
    const tenantName = booking.renter?.full_name || "Khách";
    const tenantInitials = tenantName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    // Parse date and time from booking_date (stored as ISO timestamp: YYYY-MM-DDTHH:mm:ss)
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">Chờ xác nhận</Badge>;
            case "confirmed":
                return <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">Đã xác nhận</Badge>;
            case "completed":
                return <Badge className="bg-info/10 text-info border-info/20 hover:bg-info/20">Hoàn thành</Badge>;
            case "cancelled":
                return <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className="overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 border border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={booking.renter?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xs">
                                {tenantInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base font-semibold">{tenantName}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {bookingDateStr}
                                {bookingTimeStr && bookingTimeStr !== "00:00" && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">lúc {bookingTimeStr}</span>
                                )}
                            </CardDescription>
                        </div>
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
                            <p className="text-xs text-muted-foreground truncate">{booking.room.address}</p>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                )}

                {/* Contact info and Message (Show only if relevant states) */}
                {(booking.renter?.phone || booking.note) && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                            {booking.renter?.phone && (
                                <a
                                    href={`tel:${booking.renter?.phone}`}
                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted/30 px-2 py-1 rounded-md"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    {booking.renter?.phone}
                                </a>
                            )}
                            {booking.renter?.email && (
                                <a
                                    href={`mailto:${booking.renter?.email}`}
                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted/30 px-2 py-1 rounded-md"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    {booking.renter?.email}
                                </a>
                            )}
                        </div>

                        {booking.note && (
                            <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                                <p className="text-sm text-foreground/80 italic">
                                    <MessageCircle className="w-3.5 h-3.5 inline-block mr-2 text-secondary" />
                                    "{booking.note}"
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                {showActions && (
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl h-10 border-destructive/20 hover:bg-destructive/5 hover:text-destructive" onClick={onReject}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Từ chối
                        </Button>
                        <Button className="flex-1 rounded-xl h-10 bg-success hover:bg-success/90 text-white" onClick={onConfirm}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Xác nhận
                        </Button>
                    </div>
                )}

                {showCompleteButton && (
                    <div className="pt-2">
                        <Button className="w-full rounded-xl h-10" onClick={onComplete}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Đánh dấu hoàn thành
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
