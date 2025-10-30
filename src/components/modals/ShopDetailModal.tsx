import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Gift,
  QrCode,
  Navigation,
  X,
  CheckCircle2,
} from "lucide-react";

interface ShopDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    name: string;
    category: string;
    discount: string;
    distance: string;
    image: string;
    icon: any;
    color: string;
  };
}

export function ShopDetailModal({ isOpen, onClose, shop }: ShopDetailModalProps) {
  const [showVoucher, setShowVoucher] = useState(false);

  const handleClose = () => {
    onClose();
    // Reset voucher state after modal closes
    setTimeout(() => setShowVoucher(false), 300);
  };

  const shopDetails = {
    description:
      shop.category === "Café"
        ? "A cozy neighborhood café perfect for students. Great coffee, comfortable seating, and free WiFi. Ideal for studying or catching up with friends."
        : shop.category === "Gym"
        ? "Modern fitness center with state-of-the-art equipment. Offering group classes, personal training, and flexible membership options for students."
        : shop.category === "Laundry"
        ? "Professional laundry and dry cleaning service with same-day pickup and delivery. Special student rates available for weekly subscriptions."
        : "Delicious food served fresh daily. Popular student hangout with late-night hours and delivery options available.",
    hours: "Mon-Fri: 7:00 AM - 10:00 PM | Sat-Sun: 9:00 AM - 11:00 PM",
    phone: "+1 (555) 123-4567",
    email: "contact@" + shop.name.toLowerCase().replace(/\s+/g, "") + ".com",
    address: "123 Main Street, Downtown Area",
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{shop.name} - Shop Details</DialogTitle>
          <DialogDescription>
            View exclusive student discount details and get your voucher for {shop.name}
          </DialogDescription>
        </VisuallyHidden>
        {/* Hero Image */}
        <div className="relative h-64 overflow-hidden rounded-t-xl">
          <img
            src={shop.image}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-4 right-4">
            <Button
              onClick={handleClose}
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/90 hover:bg-white shadow-md"
            >
              <X className="w-4 h-4 text-primary" />
            </Button>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-white mb-2">{shop.name}</h1>
                <Badge className={`${shop.color} border-0`}>
                  <shop.icon className="w-3 h-3 mr-1" />
                  {shop.category}
                </Badge>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full bg-white/90 text-gray-900"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {shop.distance}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Offer Banner */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Exclusive RoomZ Offer</p>
                <h2 className="text-primary">{shop.discount}</h2>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-2">About {shop.name}</h3>
            <p className="text-sm text-gray-600">{shopDetails.description}</p>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h3>Contact & Location</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Opening Hours</p>
                  <p className="text-xs text-gray-600">{shopDetails.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-xs text-gray-600">{shopDetails.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-gray-600">{shopDetails.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-xs text-gray-600">{shopDetails.address}</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Navigation className="w-4 h-4 mr-1" />
                  Directions
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Voucher Section */}
          <div className="space-y-4">
            <h3>Get Your Discount Voucher</h3>
            {!showVoucher ? (
              <Button
                onClick={() => setShowVoucher(true)}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Generate Voucher
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* QR Code */}
                <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-300">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                  <p className="text-xs text-center text-gray-600">
                    Scan this code at {shop.name}
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl p-4 space-y-2">
                  <p className="text-sm mb-2">How to Redeem:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>Show this QR code to the cashier before payment</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>Present your student ID if required</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>Discount will be applied automatically</span>
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-700">
                    ⏰ Valid until: December 31, 2025
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full h-12"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button className="flex-1 rounded-full h-12 bg-primary hover:bg-primary/90">
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
