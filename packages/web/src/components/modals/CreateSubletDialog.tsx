import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, DollarSign, Home, Plus } from "lucide-react";

interface CreateSubletDialogProps {
  children?: React.ReactNode;
}

export function CreateSubletDialog({ children }: CreateSubletDialogProps) {
  const [price, setPrice] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button className="rounded-xl bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Đăng chỗ ở ngắn hạn
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Đăng chỗ ở ngắn hạn</DialogTitle>
          <DialogDescription>
            Tạo nhanh một tin ở ngắn hạn để host khác hoặc người cần ở tạm có thể xem và liên hệ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề tin</Label>
            <Input
              id="title"
              placeholder="Ví dụ: Studio gần trường, trống trong 2 tháng"
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Ngày bắt đầu</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="start-date" type="date" className="rounded-xl pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Ngày kết thúc</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="end-date" type="date" className="rounded-xl pl-10" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Giá theo tháng (VND)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <CurrencyInput
                id="price"
                placeholder="3.500.000"
                className="rounded-xl pl-10"
                value={price}
                onValueChange={setPrice}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả thêm</Label>
            <Textarea
              id="description"
              placeholder="Nói rõ điều kiện ở, tiện nghi, lịch trống và những lưu ý cần trao đổi thêm với người ở tạm."
              className="min-h-32 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Loại chỗ ở</Label>
            <div className="flex flex-wrap gap-2">
              {["Phòng riêng", "Phòng chung", "Studio", "Nguyên căn"].map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="cursor-pointer rounded-lg px-3 py-1 transition-colors hover:bg-primary hover:text-white"
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <Button className="h-11 w-full rounded-xl bg-primary hover:bg-primary/90">
            <Home className="mr-2 h-4 w-4" />
            Đăng tin ở ngắn hạn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
