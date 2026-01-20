import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
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
  roomTitle 
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

  // Format date for API
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
  
  // Get available time slots
  const { slots, loading: slotsLoading, refetch: refetchSlots } = useAvailableTimeSlots(
    roomId || '', 
    formattedDate
  );

  // Initialize contact info from profile
  useEffect(() => {
    if (profile) {
      setContactName(profile.full_name || '');
      setContactPhone(profile.phone || '');
      setContactEmail(user?.email || '');
    }
  }, [profile, user]);

  // Refetch slots when date changes
  useEffect(() => {
    if (date && roomId) {
      refetchSlots(formattedDate);
      setSelectedTime(''); // Reset time selection
    }
  }, [date, roomId, formattedDate, refetchSlots]);

  const handleConfirmBooking = async () => {
    if (!date || !selectedTime || !roomId || !landlordId) {
      toast.error("Vui lòng chọn ngày và giờ xem phòng");
      return;
    }

    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt lịch xem phòng");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createNewBooking({
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

      setIsConfirmed(true);
      toast.success("Đặt lịch thành công!");
      
      // Auto close after showing confirmation
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể đặt lịch. Vui lòng thử lại.';
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

  // Group time slots by period
  const morningSlots = slots.filter(s => parseInt(s) < 12);
  const afternoonSlots = slots.filter(s => parseInt(s) >= 12 && parseInt(s) < 17);
  const eveningSlots = slots.filter(s => parseInt(s) >= 17);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden" aria-describedby={undefined}>
        {!isConfirmed ? (
          <>
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CalendarCheck className="w-6 h-6 text-primary" />
                Đặt lịch xem phòng
              </DialogTitle>
              <DialogDescription>
                {roomTitle ? `Đặt lịch xem: ${roomTitle}` : 'Chọn ngày và giờ bạn muốn'}
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Date Picker */}
              <div>
                <Label className="mb-3 block">Chọn ngày</Label>
                <div className="flex justify-center border rounded-2xl p-4 bg-muted/30">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date() || d > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                    className="rounded-xl"
                    locale={vi}
                  />
                </div>
              </div>

              {/* Time Slot Selector */}
              {date && (
                <div>
                  <Label className="mb-3 block">Chọn giờ</Label>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Đang tải...</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Không còn slot trống trong ngày này</p>
                      <p className="text-sm">Vui lòng chọn ngày khác</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Morning slots */}
                      {morningSlots.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Buổi sáng</p>
                          <div className="flex flex-wrap gap-2">
                            {morningSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`px-4 py-2 rounded-full text-sm transition-all ${
                                  selectedTime === time
                                    ? "bg-primary text-white"
                                    : "bg-muted hover:bg-primary/10"
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Afternoon slots */}
                      {afternoonSlots.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Buổi chiều</p>
                          <div className="flex flex-wrap gap-2">
                            {afternoonSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`px-4 py-2 rounded-full text-sm transition-all ${
                                  selectedTime === time
                                    ? "bg-primary text-white"
                                    : "bg-muted hover:bg-primary/10"
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evening slots */}
                      {eveningSlots.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Buổi tối</p>
                          <div className="flex flex-wrap gap-2">
                            {eveningSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`px-4 py-2 rounded-full text-sm transition-all ${
                                  selectedTime === time
                                    ? "bg-primary text-white"
                                    : "bg-muted hover:bg-primary/10"
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <Label className="block">Thông tin liên hệ</Label>
                <div className="grid gap-3">
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Họ và tên"
                    className="rounded-xl"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="rounded-xl"
                      type="tel"
                    />
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Email"
                      className="rounded-xl"
                      type="email"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="mb-3 block">
                  Ghi chú cho chủ nhà <span className="text-muted-foreground">(không bắt buộc)</span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Câu hỏi hoặc yêu cầu cụ thể của bạn?"
                  className="rounded-xl min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-full h-12"
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={!date || !selectedTime || isSubmitting || !user}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận đặt lịch"
                )}
              </Button>
            </div>
          </>
        ) : (
          // Confirmation State
          <>
            <VisuallyHidden>
              <DialogTitle>Đặt lịch thành công</DialogTitle>
              <DialogDescription>
                Lịch xem phòng đã được đặt thành công
              </DialogDescription>
            </VisuallyHidden>
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Đặt lịch thành công!</h3>
              <p className="text-muted-foreground mb-4">
                Lịch xem phòng đã được đặt thành công. Chủ nhà sẽ liên hệ với bạn sớm.
              </p>
              {date && selectedTime && (
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-muted-foreground">Thời gian xem phòng</p>
                  <p className="font-medium">
                    {format(date, 'EEEE, dd/MM/yyyy', { locale: vi })} lúc {selectedTime}
                  </p>
                </div>
              )}
              <Badge className="bg-green-100 text-green-700 border-green-300">
                Xác nhận đã gửi đến email của bạn
              </Badge>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
