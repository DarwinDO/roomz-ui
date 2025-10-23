import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sparkles } from "lucide-react";

interface CleaningScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CleaningScheduleModal({ isOpen, onClose, onConfirm }: CleaningScheduleModalProps) {
  const [selectedType, setSelectedType] = useState("move-in");
  const [addOns, setAddOns] = useState({
    aircon: false,
    laundry: false,
    trash: false,
  });

  const cleaningTypes = [
    { id: "move-in", label: "Move-in Cleaning", price: 80 },
    { id: "move-out", label: "Move-out Cleaning", price: 90 },
    { id: "weekly", label: "Weekly Cleaning", price: 60 },
  ];

  const addOnOptions = [
    { id: "aircon", label: "Aircon cleaning", price: 25 },
    { id: "laundry", label: "Laundry service", price: 15 },
    { id: "trash", label: "Trash removal", price: 10 },
  ];

  const basePrice = cleaningTypes.find((t) => t.id === selectedType)?.price || 0;
  const addOnPrice = Object.entries(addOns).reduce((total, [key, value]) => {
    if (value) {
      const addOn = addOnOptions.find((a) => a.id === key);
      return total + (addOn?.price || 0);
    }
    return total;
  }, 0);
  const totalPrice = basePrice + addOnPrice;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Cleaning Service</DialogTitle>
          <DialogDescription>
            Professional deep cleaning for your room or apartment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="cleaning-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Address / Room ID
            </Label>
            <Input
              id="cleaning-address"
              placeholder="e.g., 123 Main Street, Apt 4B"
              className="rounded-xl"
            />
          </div>

          {/* Cleaning Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              Cleaning Type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {cleaningTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  className={`cursor-pointer text-center justify-center py-3 px-2 rounded-xl transition-all ${
                    selectedType === type.id
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs">{type.label}</span>
                    <span className="text-xs opacity-80">${type.price}</span>
                  </div>
                </Badge>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cleaning-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Date
              </Label>
              <Input
                id="cleaning-date"
                type="date"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaning-time">Time Slot</Label>
              <select
                id="cleaning-time"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background"
              >
                <option>9:00 AM - 12:00 PM</option>
                <option>12:00 PM - 3:00 PM</option>
                <option>3:00 PM - 6:00 PM</option>
              </select>
            </div>
          </div>

          {/* Add-ons */}
          <div className="space-y-3">
            <Label>Add-ons (Optional)</Label>
            <div className="space-y-2">
              {addOnOptions.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={addOn.id}
                      checked={addOns[addOn.id as keyof typeof addOns]}
                      onCheckedChange={(checked) =>
                        setAddOns({ ...addOns, [addOn.id]: checked === true })
                      }
                    />
                    <label
                      htmlFor={addOn.id}
                      className="text-sm cursor-pointer"
                    >
                      {addOn.label}
                    </label>
                  </div>
                  <span className="text-sm text-gray-600">+${addOn.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Base cleaning</span>
              <span>${basePrice}</span>
            </div>
            {addOnPrice > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Add-ons</span>
                <span>+${addOnPrice}</span>
              </div>
            )}
            <div className="pt-3 border-t border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-2xl text-primary">${totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Student Discount */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-sm text-amber-800">
              🎓 Student discount (15%) will be applied at checkout
            </p>
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
