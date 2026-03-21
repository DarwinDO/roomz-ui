import { Building2, CheckCircle, FileText, Loader2, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BecomeLandlordFormData } from '../types';

interface BecomeLandlordFormProps {
  title?: string;
  formData: BecomeLandlordFormData;
  setFormData: React.Dispatch<React.SetStateAction<BecomeLandlordFormData>>;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function BecomeLandlordForm({
  title = 'Thông tin đăng ký',
  formData,
  setFormData,
  handleSubmit,
  isSubmitting,
}: BecomeLandlordFormProps) {
  return (
    <Card className="animate-fade-in-up rounded-[28px] border border-border/70 bg-white/85 shadow-soft-lg backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          {title}
        </CardTitle>
        <CardDescription>
          Điền thông tin để RommZ xác minh và kích hoạt tài khoản host rõ ràng hơn thay vì lưu tạm trong hồ sơ người dùng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Số điện thoại liên hệ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0912 345 678"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                required
                className="h-11 rounded-xl border-gray-200 bg-gray-50/50 transition-colors focus:bg-white"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyCount" className="flex items-center gap-2 font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Số lượng phòng/căn hộ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="propertyCount"
                type="number"
                placeholder="Ví dụ: 5"
                min="1"
                value={formData.propertyCount}
                onChange={(event) => setFormData({ ...formData, propertyCount: event.target.value })}
                required
                className="h-11 rounded-xl border-gray-200 bg-gray-50/50 transition-colors focus:bg-white"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2 font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Địa chỉ tài sản chính <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              placeholder="Số nhà, đường, quận/huyện, thành phố"
              value={formData.address}
              onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              required
              className="h-11 rounded-xl border-gray-200 bg-gray-50/50 transition-colors focus:bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="font-medium">
              Kinh nghiệm vận hành
            </Label>
            <Input
              id="experience"
              placeholder="Ví dụ: 3 năm quản lý chuỗi phòng trọ"
              value={formData.experience}
              onChange={(event) => setFormData({ ...formData, experience: event.target.value })}
              className="h-11 rounded-xl border-gray-200 bg-gray-50/50 transition-colors focus:bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-medium">
              Mô tả thêm
            </Label>
            <Textarea
              id="description"
              placeholder="Mô tả quy mô, khu vực đang vận hành hoặc những điểm bạn muốn RommZ biết thêm trước khi duyệt."
              rows={4}
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              className="min-h-[100px] resize-none rounded-xl border-gray-200 bg-gray-50/50 transition-colors focus:bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang gửi hồ sơ...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Gửi đơn đăng ký
                </>
              )}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Khi gửi đơn, bạn đồng ý để RommZ xem xét hồ sơ host này và liên hệ lại nếu cần bổ sung thông tin vận hành.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
