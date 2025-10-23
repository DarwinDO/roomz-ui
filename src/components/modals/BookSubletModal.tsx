import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, CheckCircle2 } from "lucide-react";

interface BookSubletModalProps {
  isOpen: boolean;
  onClose: () => void;
  sublet: {
    title: string;
    location: string;
    price: number;
    distance: string;
  };
}

export function BookSubletModal({ isOpen, onClose, sublet }: BookSubletModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    setIsConfirmed(true);
    // In a real app, this would process the booking
  };

  const handleClose = () => {
    setIsConfirmed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {!isConfirmed ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Sublet Booking</DialogTitle>
              <DialogDescription>
                Review the details before confirming your booking
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Booking Summary */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10 space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Room</p>
                  <p className="font-medium">{sublet.title}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <span>{sublet.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>{sublet.distance}</span>
                </div>

                <div className="pt-3 border-t border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Price</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-xl text-primary">{sublet.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  <strong>Next steps:</strong> The host will receive your booking request and will
                  contact you to finalize the details. Payment will be processed securely through RoomZ.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-6 py-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-secondary" />
              </div>

              <div>
                <DialogTitle className="text-center mb-2">Booking Confirmed!</DialogTitle>
                <DialogDescription className="text-center">
                  You'll receive a message from the host soon to finalize the details.
                </DialogDescription>
              </div>

              {/* Confirmation Details */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10 text-left">
                <p className="text-sm mb-3">
                  <strong>What's next?</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>The host will review your request</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>You'll receive a message to discuss details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>Secure payment through RoomZ platform</span>
                  </li>
                </ul>
              </div>

              {/* Close Button */}
              <Button
                onClick={handleClose}
                className="w-full bg-primary hover:bg-primary/90 rounded-full h-12"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
