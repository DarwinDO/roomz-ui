import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, DollarSign, Truck } from "lucide-react";

interface BookMovingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function BookMovingModal({ isOpen, onClose, onConfirm }: BookMovingModalProps) {
  const [estimatedPrice, setEstimatedPrice] = useState(150);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Book Moving Service</DialogTitle>
          <DialogDescription>
            Professional movers to help you relocate safely and quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Pickup Address */}
          <div className="space-y-2">
            <Label htmlFor="pickup-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Pickup Address
            </Label>
            <Input
              id="pickup-address"
              placeholder="e.g., 123 Main Street, Apt 4B"
              className="rounded-xl"
            />
          </div>

          {/* Destination Address */}
          <div className="space-y-2">
            <Label htmlFor="destination-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-secondary" />
              Destination Address
            </Label>
            <Input
              id="destination-address"
              placeholder="e.g., 456 Oak Avenue, Unit 2C"
              className="rounded-xl"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="move-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Date
              </Label>
              <Input
                id="move-date"
                type="date"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="move-time">Time</Label>
              <Input
                id="move-time"
                type="time"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Estimated Price */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Price</p>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-sm text-gray-600">Standard Moving (2 movers)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-2xl text-primary">{estimatedPrice}</span>
                </div>
                <p className="text-xs text-gray-500">Base rate</p>
              </div>
            </div>
          </div>

          {/* Discount Badge */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              🎓
            </div>
            <div className="flex-1">
              <p className="text-sm">Student Discount Applied!</p>
              <p className="text-xs text-gray-600">Save 15% on your booking</p>
            </div>
            <span className="text-amber-700">-$22.50</span>
          </div>

          {/* Final Price */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Price</span>
              <span className="text-xl text-primary">${(estimatedPrice * 0.85).toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
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
      </DialogContent>
    </Dialog>
  );
}
