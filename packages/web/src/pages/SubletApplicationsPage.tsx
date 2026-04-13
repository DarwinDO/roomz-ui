/**
 * SubletApplicationsPage
 * View and manage applications for a specific short-stay listing.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, MessageCircle, User, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PremiumAvatar } from '@/components/ui/PremiumAvatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSubletApplications, useRespondToApplication } from '@/hooks/useSublets';
import { toast } from 'sonner';
import { startConversation } from '@/services/chat';
import { useAuth } from '@/contexts';
import type { SubletApplication } from '@roomz/shared/types/swap';

export default function SubletApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: applications, isLoading, error } = useSubletApplications(id || '');
  const respondToApplication = useRespondToApplication();

  const [selectedApp, setSelectedApp] = useState<SubletApplication | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const handleApprove = async (app: SubletApplication) => {
    try {
      await respondToApplication.mutateAsync({
        applicationId: app.id,
        status: 'approved',
      });
      toast.success('Đã duyệt đơn', {
        description: 'Người gửi đơn sẽ thấy chỗ ở ngắn hạn này đã được chấp nhận.',
      });
    } catch {
      toast.error('Không thể duyệt đơn.');
    }
  };

  const handleReject = (app: SubletApplication) => {
    setSelectedApp(app);
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!selectedApp) {
      return;
    }

    try {
      await respondToApplication.mutateAsync({
        applicationId: selectedApp.id,
        status: 'rejected',
      });
      toast.success('Đã từ chối đơn', {
        description: 'Người đăng ký sẽ nhận được cập nhật mới.',
      });
    } catch {
      toast.error('Không thể từ chối đơn.');
    } finally {
      setRejectDialogOpen(false);
      setSelectedApp(null);
    }
  };

  const handleMessage = async (app: SubletApplication) => {
    const recipientId = app.applicant?.id || app.applicant_id;
    if (!recipientId || !user) {
      toast.error('Không thể nhắn tin vì thiếu thông tin người đăng ký.');
      return;
    }

    try {
      const conversation = await startConversation(recipientId, user.id);
      navigate(`/messages/${conversation.id}`);
    } catch {
      toast.error('Không thể tạo cuộc trò chuyện.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Đang tải danh sách đơn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md p-8 text-center">
          <p className="mb-2 text-destructive">Không thể tải danh sách đơn quan tâm.</p>
          <Button onClick={() => navigate('/my-sublets')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  const pendingApps = applications?.filter((application: SubletApplication) => application.status === 'pending') || [];
  const reviewedApps = applications?.filter((application: SubletApplication) => application.status !== 'pending') || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="scroll-lock-shell sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/my-sublets')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  navigate('/my-sublets');
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Đơn quan tâm</h1>
              <p className="text-sm text-muted-foreground">{applications?.length || 0} đơn cho chỗ ở này</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span>{pendingApps.length} đang chờ duyệt</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {!applications?.length ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-medium">Chưa có đơn quan tâm nào</h3>
            <p className="text-muted-foreground">Chỗ ở ngắn hạn này hiện chưa có ai gửi yêu cầu.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingApps.length > 0 ? (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Badge variant="secondary">{pendingApps.length}</Badge>
                  Đang chờ duyệt
                </h2>
                {pendingApps.map((app: SubletApplication) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onApprove={() => handleApprove(app)}
                    onReject={() => handleReject(app)}
                    onMessage={() => handleMessage(app)}
                    isProcessing={respondToApplication.isPending}
                  />
                ))}
              </div>
            ) : null}

            {pendingApps.length > 0 && reviewedApps.length > 0 ? <Separator className="my-6" /> : null}

            {reviewedApps.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground">Đã xử lý ({reviewedApps.length})</h2>
                {reviewedApps.map((app: SubletApplication) => (
                  <ApplicationCard key={app.id} app={app} onMessage={() => handleMessage(app)} isProcessing={false} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối đơn quan tâm?</AlertDialogTitle>
            <AlertDialogDescription>
              Người gửi đơn sẽ nhận được cập nhật rằng chỗ ở này hiện chưa phù hợp với nhu cầu của họ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ApplicationCardProps {
  app: SubletApplication;
  onApprove?: () => void;
  onReject?: () => void;
  onMessage: () => void;
  isProcessing: boolean;
}

function ApplicationCard({ app, onApprove, onReject, onMessage, isProcessing }: ApplicationCardProps) {
  const applicant = app.applicant;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <PremiumAvatar isPremium={applicant?.is_premium ?? false} className="h-14 w-14">
          {applicant?.avatar_url ? <AvatarImage src={applicant.avatar_url} alt={applicant.full_name || 'Người dùng'} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary">{applicant?.full_name?.charAt(0) || 'U'}</AvatarFallback>
        </PremiumAvatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">{applicant?.full_name || 'Người dùng'}</h3>
              <p className="text-sm text-muted-foreground">Gửi lúc {new Date(app.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
            {getStatusBadge(app.status)}
          </div>

          {app.message ? (
            <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
              <p className="italic">&ldquo;{app.message}&rdquo;</p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onMessage}>
              <MessageCircle className="mr-1.5 h-4 w-4" />
              Nhắn tin
            </Button>

            {app.status === 'pending' && onApprove && onReject ? (
              <>
                <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50" onClick={onApprove} disabled={isProcessing}>
                  <Check className="mr-1.5 h-4 w-4" />
                  Duyệt
                </Button>
                <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50" onClick={onReject} disabled={isProcessing}>
                  <X className="mr-1.5 h-4 w-4" />
                  Từ chối
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
