import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, MapPin, CheckCircle2 } from "lucide-react";

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: {
    name: string;
    category: string;
    discount: string;
    distance: string;
  };
}

export function VoucherModal({ isOpen, onClose, partner }: VoucherModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>RoomZ Perk Voucher</DialogTitle>
          <DialogDescription>
            Show this QR code at checkout to claim your discount
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Partner Info */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎁</span>
            </div>
            <h2 className="mb-1">{partner.name}</h2>
            <Badge className="bg-primary/10 text-primary border-0">
              {partner.category}
            </Badge>
          </div>

          {/* Discount Badge */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 text-center border-2 border-primary/20">
            <p className="text-sm text-gray-600 mb-2">Your Exclusive Offer</p>
            <h1 className="text-primary mb-1">{partner.discount}</h1>
            <p className="text-xs text-gray-600">Valid for RoomZ members only</p>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-300">
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-24 h-24 text-gray-400" />
            </div>
            <p className="text-xs text-center text-gray-600">
              Scan this code at {partner.name}
            </p>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{partner.distance}</span>
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

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 rounded-full h-12"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
