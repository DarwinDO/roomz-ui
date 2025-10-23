import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Crown, CreditCard, Wallet, Sparkles } from "lucide-react";

interface UpgradeRoomZPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpgradeRoomZPlusModal({
  isOpen,
  onClose,
  onSuccess,
}: UpgradeRoomZPlusModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const benefits = [
    "Priority placement in search results",
    "Advanced compatibility matching algorithm",
    "Access to exclusive local perks and discounts",
    "No booking fees on all reservations",
    "Verified+ badge on your profile",
    "24/7 priority customer support",
    "Early access to new features",
  ];

  const handleUpgrade = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header with Gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary via-primary to-secondary rounded-t-xl -z-10" />
        
        <DialogHeader className="relative text-white pt-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-white text-center text-2xl">
            Unlock RoomZ+ Premium
          </DialogTitle>
          <DialogDescription className="text-white/90 text-center">
            Get the best housing experience with exclusive benefits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 mt-8">
          {/* Pricing */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl text-primary">$9.89</span>
              <span className="text-gray-600">/month</span>
            </div>
            <Badge className="bg-secondary/10 text-secondary border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              First month 50% off - Only $4.95!
            </Badge>
          </div>

          <Separator />

          {/* Benefits */}
          <div>
            <h3 className="mb-4">Premium Benefits</h3>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors"
                >
                  <div className="w-5 h-5 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <h3>Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-2">
                {/* Credit/Debit Card */}
                <div
                  className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <RadioGroupItem value="card" id="card" className="mr-3" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Credit / Debit Card</p>
                        <p className="text-xs text-gray-600">
                          Visa, Mastercard, Amex accepted
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>

                {/* Student Wallet */}
                <div
                  className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === "wallet"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setPaymentMethod("wallet")}
                >
                  <RadioGroupItem value="wallet" id="wallet" className="mr-3" />
                  <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">Student Wallet</p>
                        <p className="text-xs text-gray-600">Balance: $125.50</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-gray-700">
              💡 <strong>Cancel anytime.</strong> No commitment required. You can
              downgrade or cancel your subscription from your account settings at any time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-full h-12"
              disabled={isProcessing}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Confirm Upgrade
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
