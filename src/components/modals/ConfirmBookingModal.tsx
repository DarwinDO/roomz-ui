import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface ConfirmBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sublet: {
    title: string;
    location: string;
    price: number;
    distance: string;
  };
}

export function ConfirmBookingModal({ isOpen, onClose, sublet }: ConfirmBookingModalProps) {
  const handleConfirm = () => {
    toast.success("Booking request sent to host!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Your Sublet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Room Details */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-4 space-y-3">
            <h3 className="text-base">{sublet.title}</h3>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{sublet.location}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{sublet.distance}</span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-primary">${sublet.price}</span>
              <span className="text-sm text-gray-600">/month</span>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> This booking request will be sent to the host for approval. 
              You'll receive a notification once they respond.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
