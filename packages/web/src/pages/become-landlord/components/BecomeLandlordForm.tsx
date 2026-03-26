import { Building2, FileCheck2, FileText, Loader2, MapPin, Phone, Save, ShieldCheck } from 'lucide-react';
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
  onSaveDraft: () => void;
  lastSavedAt?: string | null;
}

function formatSavedAt(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new Date(value).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return null;
  }
}

export function BecomeLandlordForm({
  title = 'Thông tin đăng ký',
  formData,
  setFormData,
  handleSubmit,
  isSubmitting,
  onSaveDraft,
  lastSavedAt,
}: BecomeLandlordFormProps) {
  const savedLabel = formatSavedAt(lastSavedAt);

  return (
    <Card className="rounded-[40px] border border-white/70 bg-white/95 shadow-[0_28px_60px_rgba(40,43,81,0.08)] backdrop-blur-sm">
      <CardHeader className="space-y-4 px-6 pb-0 pt-6 md:px-10 md:pt-10">
        <CardTitle className="flex items-center gap-3 font-display text-3xl font-black tracking-tight text-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
          Điền thông tin để RommZ xác minh và kích hoạt tài khoản host rõ ràng hơn thay vì lưu tạm trong hồ sơ
          người dùng.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-6 md:px-10 md:pb-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2.5">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Phone className="h-4 w-4 text-slate-500" />
                Số điện thoại liên hệ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0912 345 678"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                required
                className="h-12 rounded-2xl border-outline-variant/40 bg-[var(--surface-container-low)] text-base shadow-none transition-colors focus-visible:bg-white"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="propertyCount" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Building2 className="h-4 w-4 text-slate-500" />
                Số lượng phòng/căn hộ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="propertyCount"
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="Ví dụ: 5"
                value={formData.propertyCount}
                onChange={(event) => setFormData({ ...formData, propertyCount: event.target.value })}
                required
                className="h-12 rounded-2xl border-outline-variant/40 bg-[var(--surface-container-low)] text-base shadow-none transition-colors focus-visible:bg-white"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-slate-500" />
              Địa chỉ tài sản chính <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              placeholder="Số nhà, đường, quận/huyện, thành phố"
              value={formData.address}
              onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              required
              className="h-12 rounded-2xl border-outline-variant/40 bg-[var(--surface-container-low)] text-base shadow-none transition-colors focus-visible:bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="experience" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              Loại hình / kinh nghiệm vận hành
            </Label>
            <Input
              id="experience"
              placeholder="Ví dụ: Phòng trọ sinh viên, 2 năm tự quản lý"
              value={formData.experience}
              onChange={(event) => setFormData({ ...formData, experience: event.target.value })}
              className="h-12 rounded-2xl border-outline-variant/40 bg-[var(--surface-container-low)] text-base shadow-none transition-colors focus-visible:bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="description" className="text-sm font-semibold text-slate-800">
              Mô tả ngắn
            </Label>
            <Textarea
              id="description"
              placeholder="Mô tả quy mô, khu vực đang vận hành hoặc những điểm bạn muốn RommZ biết thêm trước khi duyệt."
              rows={5}
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              className="min-h-[132px] resize-none rounded-[24px] border-outline-variant/40 bg-[var(--surface-container-low)] text-base leading-7 shadow-none transition-colors focus-visible:bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="rounded-[28px] bg-[var(--surface-container-low)] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold tracking-tight text-slate-900">Giấy tờ xác minh</h3>
                <p className="text-sm leading-6 text-slate-600">
                  Ở lượt đầu này, RommZ sẽ đối chiếu hồ sơ qua số điện thoại, địa chỉ tài sản và mô tả vận hành.
                  Khi cần xác minh sâu hơn, đội ngũ sẽ liên hệ để nhận thêm giấy tờ như CCCD, hợp đồng thuê hoặc giấy
                  tờ chứng minh quyền quản lý chỗ ở.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center">
            <Button
              type="submit"
              className="h-12 rounded-full bg-[image:var(--cta-primary)] px-8 text-base font-semibold text-white shadow-[0_20px_40px_rgba(0,80,212,0.18)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang gửi hồ sơ...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Gửi hồ sơ host
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              className="h-12 rounded-full border-outline-variant/50 bg-white px-8 text-base font-semibold text-slate-800"
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Lưu tạm
            </Button>

            {savedLabel ? (
              <p className="text-sm text-slate-500 md:ml-auto">Đã lưu tạm lúc {savedLabel}</p>
            ) : null}
          </div>

          <p className="text-sm leading-6 text-slate-500">
            Khi gửi hồ sơ, bạn đồng ý để RommZ xem xét đơn host này và liên hệ lại nếu cần bổ sung thêm thông tin vận
            hành.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
