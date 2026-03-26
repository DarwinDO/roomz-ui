import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock3, FileBadge2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts';
import { useMyHostApplication, useSubmitHostApplication } from '@/hooks/useHostApplications';
import { mapApplicationToDraft } from '@/services/hostApplications';
import type { BecomeLandlordFormData } from './become-landlord/types';
import { BecomeLandlordForm } from './become-landlord/components/BecomeLandlordForm';
import { BecomeLandlordIntro } from './become-landlord/components/BecomeLandlordIntro';
import { BecomeLandlordPending } from './become-landlord/components/BecomeLandlordPending';

const HOST_APPLICATION_DRAFT_KEY = 'rommz.host-application-draft.v1';

export default function BecomeLandlordPage() {
  const navigate = useNavigate();
  const { user, profile, refreshUser } = useAuth();
  const { data: application, isLoading: isApplicationLoading } = useMyHostApplication(Boolean(user));
  const submitMutation = useSubmitHostApplication();
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [formData, setFormData] = useState<BecomeLandlordFormData>({
    phone: profile?.phone || '',
    address: '',
    propertyCount: '',
    experience: '',
    description: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined' || application) {
      return;
    }

    try {
      const savedDraft = window.localStorage.getItem(HOST_APPLICATION_DRAFT_KEY);
      if (!savedDraft) {
        return;
      }

      const parsed = JSON.parse(savedDraft) as { formData?: BecomeLandlordFormData; savedAt?: string };
      const draftForm = parsed.formData;
      if (draftForm) {
        setFormData((current) => ({
          ...current,
          ...draftForm,
          phone: draftForm.phone || current.phone,
        }));
      }
      setLastSavedAt(parsed.savedAt ?? null);
    } catch (error) {
      console.error('Error restoring host application draft:', error);
    }
  }, [application]);

  useEffect(() => {
    if (!application) {
      return;
    }

    setFormData(mapApplicationToDraft(application));
    setLastSavedAt(null);
  }, [application]);

  useEffect(() => {
    if (profile?.role === 'landlord') {
      navigate('/host', { replace: true });
    }
  }, [navigate, profile?.role]);

  const isPendingApproval = application?.status === 'submitted' || profile?.account_status === 'pending_landlord';
  const rejectionReason = application?.status === 'rejected' ? application.rejectionReason : null;
  const helperTitle = useMemo(() => {
    if (application?.status === 'rejected') {
      return 'Cập nhật lại hồ sơ host';
    }

    return 'Thông tin đăng ký';
  }, [application?.status]);

  const handleSaveDraft = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedAt = new Date().toISOString();
    window.localStorage.setItem(
      HOST_APPLICATION_DRAFT_KEY,
      JSON.stringify({
        formData,
        savedAt,
      }),
    );
    setLastSavedAt(savedAt);
    toast.success('Đã lưu tạm hồ sơ host trên thiết bị này');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      navigate('/login');
      return;
    }

    try {
      await submitMutation.mutateAsync(formData);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(HOST_APPLICATION_DRAFT_KEY);
      }
      setLastSavedAt(null);
      await refreshUser();
    } catch (error) {
      console.error('Error submitting host application:', error);
    }
  };

  if (isPendingApproval) {
    return <BecomeLandlordPending submittedAt={application?.submittedAt ?? null} />;
  }

  if (isApplicationLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hero-bg)]">
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ host...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--hero-bg)] pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <BecomeLandlordIntro />

        {rejectionReason ? (
          <Alert className="mb-6 rounded-[28px] border-amber-200 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Hồ sơ host cần bổ sung thêm thông tin</AlertTitle>
            <AlertDescription className="mt-2 leading-7">{rejectionReason}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <BecomeLandlordForm
            title={helperTitle}
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
            onSaveDraft={handleSaveDraft}
            lastSavedAt={lastSavedAt}
          />

          <div className="space-y-6">
            <Card className="rounded-[32px] border border-white/60 bg-white/90 shadow-[0_24px_50px_rgba(40,43,81,0.07)]">
              <CardHeader className="pb-0">
                <CardTitle className="font-display text-2xl font-black tracking-tight text-slate-900">
                  Quy trình xét duyệt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="rounded-[24px] bg-[var(--surface-container-low)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                      <FileBadge2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-slate-900">1. Gửi hồ sơ</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        RommZ kiểm tra thông tin liên hệ, quy mô vận hành và địa chỉ tài sản chính của bạn.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-[var(--surface-container-low)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-slate-900">2. Xác minh</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Đội ngũ có thể liên hệ qua điện thoại hoặc yêu cầu giấy tờ bổ sung để xác thực độ tin cậy.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-[var(--surface-container-low)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-slate-900">3. Kích hoạt</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Khi hồ sơ đạt yêu cầu, bạn sẽ vào được bảng điều khiển chủ nhà để đăng phòng và quản lý lịch hẹn.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-dashed border-outline-variant/60 bg-[var(--surface-container-low)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Thời gian phản hồi</p>
                  <p className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900">24h làm việc</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Với hồ sơ cần đối chiếu thêm giấy tờ, thời gian có thể kéo dài hơn một chút nhưng vẫn được cập nhật
                    rõ trạng thái trong RommZ.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border border-white/60 bg-white/90 shadow-[0_24px_50px_rgba(40,43,81,0.07)]">
              <CardHeader className="pb-0">
                <CardTitle className="font-display text-2xl font-black tracking-tight text-slate-900">
                  Hồ sơ nên có gì
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700 hover:bg-emerald-100">
                    Số điện thoại đang dùng
                  </Badge>
                  <Badge className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-100">
                    Địa chỉ tài sản chính
                  </Badge>
                  <Badge className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700 hover:bg-amber-100">
                    Quy mô vận hành
                  </Badge>
                  <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                    Mô tả ngắn rõ ràng
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
