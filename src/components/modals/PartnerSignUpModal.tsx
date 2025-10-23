import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Mail, MapPin, Gift } from "lucide-react";

interface PartnerSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function PartnerSignUpModal({ isOpen, onClose, onSubmit }: PartnerSignUpModalProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = () => {
    if (agreedToTerms) {
      onSubmit();
      onClose();
      // Reset state
      setTimeout(() => {
        setAgreedToTerms(false);
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Become a RoomZ Partner</DialogTitle>
          <DialogDescription>
            Join our Local Passport program and reach thousands of students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="business-name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Business Name
            </Label>
            <Input
              id="business-name"
              placeholder="e.g., Café 89°"
              className="rounded-xl"
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label htmlFor="business-type">Business Type</Label>
            <Select>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cafe">Café / Coffee Shop</SelectItem>
                <SelectItem value="restaurant">Restaurant / Food</SelectItem>
                <SelectItem value="gym">Gym / Fitness Studio</SelectItem>
                <SelectItem value="laundry">Laundry Service</SelectItem>
                <SelectItem value="retail">Retail / Shopping</SelectItem>
                <SelectItem value="salon">Salon / Beauty</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Person */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-person" className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Contact Person
              </Label>
              <Input
                id="contact-person"
                placeholder="Full Name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="business@example.com"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="business-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Business Address
            </Label>
            <Input
              id="business-address"
              placeholder="e.g., 123 Main Street"
              className="rounded-xl"
            />
          </div>

          {/* Offer Details */}
          <div className="space-y-2">
            <Label htmlFor="offer-details" className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-secondary" />
              Offer / Discount Details
            </Label>
            <Textarea
              id="offer-details"
              placeholder="e.g., 20% off for all RoomZ members, Free coffee with any meal purchase, etc."
              className="rounded-xl min-h-24"
            />
          </div>

          {/* Benefits Banner */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
            <h3 className="mb-3 text-sm">Partnership Benefits:</h3>
            <ul className="space-y-2 text-xs text-gray-700">
              <li>✓ Reach 10,000+ active students in your area</li>
              <li>✓ Featured listing in RoomZ Local Passport</li>
              <li>✓ Free marketing and promotion on our platform</li>
              <li>✓ Analytics dashboard to track customer visits</li>
              <li>✓ No upfront fees - only pay when students visit</li>
            </ul>
          </div>

          {/* Terms Agreement */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <div className="flex-1">
                <label
                  htmlFor="agree-terms"
                  className="text-sm cursor-pointer"
                >
                  I agree to the{" "}
                  <span className="text-primary underline">RoomZ Partner Terms & Conditions</span>{" "}
                  and understand that my business information will be displayed to RoomZ members.
                </label>
              </div>
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
              onClick={handleSubmit}
              disabled={!agreedToTerms}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Submit Application
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
