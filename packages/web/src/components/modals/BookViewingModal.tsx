import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useTenantBookings, useAvailableTimeSlots } from "@/hooks/useBookings";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { trackFeatureEvent } from "@/services/analyticsTracking";

interface BookViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  landlordId?: string;
  roomTitle?: string;
}

export function BookViewingModal({
  isOpen,
  onClose,
  roomId,
  landlordId,
  roomTitle,
}: BookViewingModalProps) {
  const { user, profile } = useAuth();
  const { createNewBooking } = useTenantBookings();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";

  const { slots, loading: slotsLoading, refetch: refetchSlots } = useAvailableTimeSlots(roomId || "", formattedDate);

  useEffect(() => {
    if (profile) {
      setContactName(profile.full_name || "");
      setContactPhone(profile.phone || "");
      setContactEmail(user?.email || "");
    }
  }, [profile, user]);

  useEffect(() => {
    if (date && roomId) {
      refetchSlots(formattedDate);
      setSelectedTime("");
    }
  }, [date, roomId, formattedDate, refetchSlots]);

  const handleConfirmBooking = async () => {
    if (!date || !selectedTime || !roomId || !landlordId) {
      toast.error("Vui lòng chọn ngày và giờ xem phòng.");
      return;
    }

    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt lịch xem phòng.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const booking = await createNewBooking({
        roomId,
        landlordId,
        bookingDate: formattedDate,
        bookingTime: selectedTime,
        message: notes,
        contactName: contactName || profile?.full_name,
        contactPhone: contactPhone || profile?.phone || undefined,
        contactEmail: contactEmail || user.email || undefined,
        durationMinutes: 30,
      });

      void trackFeatureEvent("booking_created", user.id, {
        booking_id: booking.id ?? null,
        room_id: roomId,
        landlord_id: landlordId,
        room_title: roomTitle ?? null,
        booking_date: formattedDate,
        booking_time: selectedTime,
      });

      setIsConfirmed(true);
      toast.success("Đặt lịch thành công.");

      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể đặt lịch. Vui lòng thử lại.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsConfirmed(false);
    setDate(undefined);
    setSelectedTime("");
    setNotes("");
    setError(null);
    onClose();
  };

  const morningSlots = slots.filter((slot) => parseInt(slot) < 12);
  const afternoonSlots = slots.filter((slot) => parseInt(slot) >= 12 && parseInt(slot) < 17);
  const eveningSlots = slots.filter((slot) => parseInt(slot) >= 17);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden rounded-3xl p-0 sm:max-w-[500px]" aria-describedby={undefined}>
        {!isConfirmed ? (
          <>
            <DialogHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CalendarCheck className="h-6 w-6 text-primary" />
                Đặt lịch xem phòng
              </DialogTitle>
              <DialogDescription>
                {roomTitle ? `Đặt lịch xem: ${roomTitle}` : "Chọn ngày và khung giờ phù hợp"}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
              {error ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              ) : null}

              <div>
                <Label className="mb-3 block">Chọn ngày</Label>
                <div className="flex justify-center rounded-2xl border bg-muted/30 p-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(value) => value < new Date() || value > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                    className="rounded-xl"
                    locale={vi}
                  />
                </div>
              </div>

              {date ? (
                <div>
                  <Label className="mb-3 block">Chọn giờ</Label>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Đang tải khung giờ...</span>
                    </div>
                  ) : !slots.length ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>Không còn khung giờ trống trong ngày này.</p>
                      <p className="text-sm">Vui lòng chọn ngày khác.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {morningSlots.length ? (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">Buổi sáng</p>
                          <div className="flex flex-wrap gap-2">
                            {morningSlots.map((slot) => (
                              <button
                                key={slot}
                                onClick={() => setSelectedTime(slot)}
                                className={`rounded-full px-4 py-2 text-sm transition-all ${
                                  selectedTime === slot ? "bg-primary text-white" : "bg-muted hover:bg-primary/10"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {afternoonSlots.length ? (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">Buổi chiều</p>
                          <div className="flex flex-wrap gap-2">
                            {afternoonSlots.map((slot) => (
                              <button
                                key={slot}
                                onClick={() => setSelectedTime(slot)}
                                className={`rounded-full px-4 py-2 text-sm transition-all ${
                                  selectedTime === slot ? "bg-primary text-white" : "bg-muted hover:bg-primary/10"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {eveningSlots.length ? (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">Buổi tối</p>
                          <div className="flex flex-wrap gap-2">
                            {eveningSlots.map((slot) => (
                              <button
                                key={slot}
                                onClick={() => setSelectedTime(slot)}
                                className={`rounded-full px-4 py-2 text-sm transition-all ${
                                  selectedTime === slot ? "bg-primary text-white" : "bg-muted hover:bg-primary/10"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Tên liên hệ</Label>
                  <Input id="contactName" value={contactName} onChange={(event) => setContactName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Số điện thoại</Label>
                  <Input id="contactPhone" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input id="contactEmail" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú cho host</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ví dụ: Tôi muốn xem phòng sau giờ làm, hoặc cần hỏi thêm về nội thất."
                  className="min-h-24"
                />
              </div>

              {selectedTime && date ? (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-sm">
                  <Clock className="mr-2 h-4 w-4" />
                  Đã chọn: {format(date, 'dd/MM/yyyy', { locale: vi })} • {selectedTime}
                </Badge>
              ) : null}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="h-11 flex-1 rounded-xl">
                  Hủy
                </Button>
                <Button onClick={handleConfirmBooking} disabled={isSubmitting || !date || !selectedTime} className="h-11 flex-1 rounded-xl">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                  Xác nhận lịch hẹn
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Đã giữ lịch xem phòng</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Host sẽ nhận được thông tin của bạn ngay. Bạn có thể mở tin nhắn để chốt thêm thời gian hoặc chỉ dẫn.
              </p>
            </div>
            {date && selectedTime ? (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-sm">
                {format(date, 'dd/MM/yyyy', { locale: vi })} • {selectedTime}
              </Badge>
            ) : null}
            <Button onClick={handleClose} className="rounded-xl">
              Đóng
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
