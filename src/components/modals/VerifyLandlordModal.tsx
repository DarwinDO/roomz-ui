import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, User, MapPin, Phone } from "lucide-react";

interface VerifyLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function VerifyLandlordModal({ isOpen, onClose, onComplete }: VerifyLandlordModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = () => {
    if (isConfirmed) {
      onComplete();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verify Landlord Information</DialogTitle>
          <DialogDescription>
            Provide your landlord's details to complete this verification step
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="landlord-name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Landlord Full Name
            </Label>
            <Input
              id="landlord-name"
              placeholder="e.g., John Smith"
              className="rounded-xl"
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label htmlFor="landlord-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Contact Number
            </Label>
            <Input
              id="landlord-phone"
              type="tel"
              placeholder="e.g., +1 (555) 123-4567"
              className="rounded-xl"
            />
          </div>

          {/* Property Address */}
          <div className="space-y-2">
            <Label htmlFor="property-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Property Address
            </Label>
            <Input
              id="property-address"
              placeholder="e.g., 123 Main Street, Apt 4B"
              className="rounded-xl"
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Ownership Document
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm mb-1">Click to upload document</p>
              <p className="text-xs text-gray-500">
                Lease agreement, property deed, or owner authorization (PDF, max 5MB)
              </p>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm-accuracy"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              />
              <div className="flex-1">
                <label
                  htmlFor="confirm-accuracy"
                  className="text-sm cursor-pointer"
                >
                  I confirm that the information provided is accurate and I have permission
                  to share these details for verification purposes.
                </label>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs text-gray-700">
              <strong>Privacy Notice:</strong> Your landlord's information will be kept
              confidential and only used for verification purposes. We may contact them
              to confirm the details.
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
              onClick={handleSubmit}
              disabled={!isConfirmed}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Submit Verification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
