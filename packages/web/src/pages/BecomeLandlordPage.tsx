import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts';
import { useMyHostApplication, useSubmitHostApplication } from '@/hooks/useHostApplications';
import { mapApplicationToDraft } from '@/services/hostApplications';
import type { BecomeLandlordFormData } from './become-landlord/types';
import { BecomeLandlordForm } from './become-landlord/components/BecomeLandlordForm';
import { BecomeLandlordIntro } from './become-landlord/components/BecomeLandlordIntro';
import { BecomeLandlordPending } from './become-landlord/components/BecomeLandlordPending';

export default function BecomeLandlordPage() {
  const navigate = useNavigate();
  const { user, profile, refreshUser } = useAuth();
  const { data: application, isLoading: isApplicationLoading } = useMyHostApplication(Boolean(user));
  const submitMutation = useSubmitHostApplication();
  const [formData, setFormData] = useState<BecomeLandlordFormData>({
    phone: profile?.phone || '',
    address: '',
    propertyCount: '',
    experience: '',
    description: '',
  });

  useEffect(() => {
    if (!application) {
      return;
    }

    setFormData(mapApplicationToDraft(application));
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      navigate('/login');
      return;
    }

    try {
      await submitMutation.mutateAsync(formData);
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ host...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <BecomeLandlordIntro />

        {rejectionReason ? (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Hồ sơ host cần bổ sung thêm thông tin</AlertTitle>
            <AlertDescription className="mt-2 leading-6">{rejectionReason}</AlertDescription>
          </Alert>
        ) : null}

        <BecomeLandlordForm
          title={helperTitle}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
        />
      </div>
    </div>
  );
}
