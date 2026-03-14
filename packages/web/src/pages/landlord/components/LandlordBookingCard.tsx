import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Eye, Home, Mail, MessageCircle, Phone, XCircle } from "lucide-react";
import type { BookingWithDetails } from "@/services/bookings";

interface LandlordBookingCardProps {
  booking: BookingWithDetails;
  onConfirm?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
  showCompleteButton?: boolean;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge className="border-warning/20 bg-warning/10 text-warning hover:bg-warning/20">Chờ xác nhận</Badge>;
    case "confirmed":
      return <Badge className="border-success/20 bg-success/10 text-success hover:bg-success/20">Đã xác nhận</Badge>;
    case "completed":
      return <Badge className="border-info/20 bg-info/10 text-info hover:bg-info/20">Hoàn thành</Badge>;
    case "cancelled":
      return <Badge className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20">Đã hủy</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function LandlordBookingCard({
  booking,
  onConfirm,
  onReject,
  onComplete,
  showActions,
  showCompleteButton,
}: LandlordBookingCardProps) {
  const navigate = useNavigate();
  const guestName = booking.renter?.full_name || "Khách";
  const guestInitials = guestName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const parsedDate = booking.booking_date ? parseISO(booking.booking_date) : null;
  const bookingDateLabel = parsedDate ? format(parsedDate, "EEEE, dd/MM/yyyy", { locale: vi }) : "Chưa xác định";
  const bookingTimeLabel = parsedDate ? format(parsedDate, "HH:mm") : null;
  const timeAgo = booking.created_at
    ? formatDistanceToNow(parseISO(booking.created_at), { addSuffix: true, locale: vi })
    : "";

  return (
    <Card className="overflow-hidden border border-border shadow-soft transition-all duration-300 hover:shadow-soft-lg">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={booking.renter?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs text-primary">
                {guestInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold">{guestName}</CardTitle>
              <CardDescription className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {bookingDateLabel}
                {bookingTimeLabel && bookingTimeLabel !== "00:00" ? (
                  <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">lúc {bookingTimeLabel}</span>
                ) : null}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {getStatusBadge(booking.status as string)}
            <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {booking.room ? (
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
              <p className="truncate text-xs text-muted-foreground">{booking.room.address}</p>
            </div>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : null}

        {booking.renter?.phone || booking.note ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
              {booking.renter?.phone ? (
                <a
                  href={`tel:${booking.renter.phone}`}
                  className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {booking.renter.phone}
                </a>
              ) : null}
              {booking.renter?.email ? (
                <a
                  href={`mailto:${booking.renter.email}`}
                  className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {booking.renter.email}
                </a>
              ) : null}
            </div>

            {booking.note ? (
              <div className="rounded-xl border border-secondary/10 bg-secondary/5 p-3">
                <p className="text-sm italic text-foreground/80">
                  <MessageCircle className="mr-2 inline-block h-3.5 w-3.5 text-secondary" />
                  "{booking.note}"
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {showActions ? (
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="h-10 flex-1 rounded-xl border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
              onClick={onReject}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Từ chối
            </Button>
            <Button className="h-10 flex-1 rounded-xl bg-success text-white hover:bg-success/90" onClick={onConfirm}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Xác nhận
            </Button>
          </div>
        ) : null}

        {showCompleteButton ? (
          <div className="pt-2">
            <Button className="h-10 w-full rounded-xl" onClick={onComplete}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Đánh dấu hoàn thành
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
