import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, HelpCircle } from "lucide-react";

interface SupportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function SupportRequestModal({ isOpen, onClose, onSubmit }: SupportRequestModalProps) {
  const handleSubmit = () => {
    onSubmit();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Support Request</DialogTitle>
          <DialogDescription>
            Our support team will get back to you within 24 hours
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="support-name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Your Name
            </Label>
            <Input
              id="support-name"
              placeholder="e.g., Jane Doe"
              className="rounded-xl"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="support-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email Address
            </Label>
            <Input
              id="support-email"
              type="email"
              placeholder="e.g., jane@example.com"
              className="rounded-xl"
            />
          </div>

          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issue-type" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Issue Type
            </Label>
            <Select>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moving">Moving Service</SelectItem>
                <SelectItem value="cleaning">Cleaning Service</SelectItem>
                <SelectItem value="setup">Setup & Assembly</SelectItem>
                <SelectItem value="booking">Booking Issue</SelectItem>
                <SelectItem value="payment">Payment Issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              placeholder="Describe your issue or request..."
              className="rounded-xl min-h-32"
            />
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-gray-700">
              💡 For urgent issues, please call our support hotline at{" "}
              <span className="text-primary font-medium">1-800-ROOMZ-24</span>
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
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
