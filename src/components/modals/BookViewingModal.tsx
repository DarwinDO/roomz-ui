import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, CheckCircle2 } from "lucide-react";

interface BookViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookViewingModal({ isOpen, onClose }: BookViewingModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const timeSlots = [
    { id: "morning", label: "Morning", time: "9:00 AM - 12:00 PM" },
    { id: "afternoon", label: "Afternoon", time: "12:00 PM - 5:00 PM" },
    { id: "evening", label: "Evening", time: "5:00 PM - 8:00 PM" },
  ];

  const handleConfirmBooking = () => {
    if (date && timeSlot) {
      setIsConfirmed(true);
      setTimeout(() => {
        setIsConfirmed(false);
        setDate(new Date());
        setTimeSlot("");
        setNotes("");
        onClose();
      }, 2500);
    }
  };

  const handleClose = () => {
    setIsConfirmed(false);
    setDate(new Date());
    setTimeSlot("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden" aria-describedby={undefined}>
        {!isConfirmed ? (
          <>
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CalendarCheck className="w-6 h-6 text-primary" />
                Book a Viewing
              </DialogTitle>
              <DialogDescription>
                Choose your preferred date and time
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Date Picker */}
              <div>
                <Label className="mb-3 block">Select Date</Label>
                <div className="flex justify-center border rounded-2xl p-4 bg-muted/30">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Time Slot Selector */}
              <div>
                <Label className="mb-3 block">Preferred Time Slot</Label>
                <div className="grid gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setTimeSlot(slot.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        timeSlot === slot.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            timeSlot === slot.id
                              ? "bg-primary text-white"
                              : "bg-muted"
                          }`}
                        >
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm">{slot.label}</p>
                          <p className="text-xs text-muted-foreground">{slot.time}</p>
                        </div>
                      </div>
                      {timeSlot === slot.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="mb-3 block">
                  Notes for Landlord <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific questions or requirements?"
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
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={!date || !timeSlot}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
              >
                Confirm Booking
              </Button>
            </div>
          </>
        ) : (
          // Confirmation State
          <>
            <VisuallyHidden>
              <DialogTitle>Booking Confirmed</DialogTitle>
              <DialogDescription>
                Your viewing has been successfully booked
              </DialogDescription>
            </VisuallyHidden>
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="mb-2">Viewing Booked!</h3>
              <p className="text-muted-foreground mb-4">
                Your viewing has been successfully booked. The landlord will contact you soon.
              </p>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                Confirmation sent to your email
              </Badge>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
