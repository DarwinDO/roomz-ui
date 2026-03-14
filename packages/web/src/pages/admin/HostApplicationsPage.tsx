import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard } from '@/components/admin/StatsCard';
import RejectionDialog from '@/components/admin/RejectionDialog';
import { useAdminHostApplications, useReviewHostApplication } from '@/hooks/useHostApplications';
import type { AdminHostApplicationRecord, HostApplicationStatus } from '@/services/hostApplications';
import { getHostApplicationStatusLabel } from '@/services/hostApplications';
import { AlertCircle, Building2, CheckCircle2, Clock3, Loader2, MapPin, ShieldCheck, XCircle } from 'lucide-react';

const FILTER_OPTIONS: Array<{ value: HostApplicationStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'submitted', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã phê duyệt' },
  { value: 'rejected', label: 'Cần bổ sung lại' },
  { value: 'revoked', label: 'Đã thu hồi' },
];

function getStatusBadge(status: HostApplicationStatus) {
  switch (status) {
    case 'submitted':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Đang chờ duyệt</Badge>;
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Đã phê duyệt</Badge>;
    case 'rejected':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Cần bổ sung lại</Badge>;
    case 'revoked':
      return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">Đã thu hồi</Badge>;
    default:
      return <Badge variant="outline">Không xác định</Badge>;
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Chưa có';
  }

  return new Date(value).toLocaleString('vi-VN');
}

function ApplicationCard({
  application,
  onOpen,
  onApprove,
  onReject,
  isApproving,
}: {
  application: AdminHostApplicationRecord;
  onOpen: (application: AdminHostApplicationRecord) => void;
  onApprove: (application: AdminHostApplicationRecord) => Promise<void>;
  onReject: (application: AdminHostApplicationRecord) => void;
  isApproving: boolean;
}) {
  const initials = application.userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="rounded-2xl border border-slate-200 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={application.userAvatar ?? undefined} alt={application.userName} />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{application.userName}</p>
                {getStatusBadge(application.status)}
              </div>
              <p className="mt-1 text-sm text-slate-500">{application.userEmail}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Số lượng tài sản: {application.propertyCount ?? 'Chưa rõ'}</span>
                <span>Gửi lúc: {formatDateTime(application.submittedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => onOpen(application)}>
              Xem chi tiết
            </Button>
            {application.status === 'submitted' ? (
              <>
                <Button size="sm" className="rounded-full" onClick={() => void onApprove(application)} disabled={isApproving}>
                  {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Phê duyệt
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-700" onClick={() => onReject(application)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Từ chối
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Thông tin host</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">Số điện thoại:</span> {application.phone || application.userPhone || 'Chưa có'}</p>
              <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{application.address || 'Chưa có địa chỉ'}</span></p>
              <p><span className="font-medium">Kinh nghiệm:</span> {application.experience || 'Chưa mô tả'}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trạng thái duyệt</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">Nguồn:</span> {application.source}</p>
              <p><span className="font-medium">Xử lý lúc:</span> {formatDateTime(application.reviewedAt)}</p>
              <p><span className="font-medium">Người xử lý:</span> {application.reviewedByName || 'Chưa có'}</p>
              {application.rejectionReason ? <p><span className="font-medium">Lý do:</span> {application.rejectionReason}</p> : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HostApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<HostApplicationStatus | 'all'>('all');
  const [selectedApplication, setSelectedApplication] = useState<AdminHostApplicationRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminHostApplicationRecord | null>(null);

  const { data: applications = [], isLoading, error, refetch } = useAdminHostApplications(statusFilter);
  const reviewMutation = useReviewHostApplication();

  const stats = useMemo(
    () => ({
      total: applications.length,
      submitted: applications.filter((application) => application.status === 'submitted').length,
      approved: applications.filter((application) => application.status === 'approved').length,
      rejected: applications.filter((application) => application.status === 'rejected').length,
    }),
    [applications],
  );

  const handleApprove = async (application: AdminHostApplicationRecord) => {
    await reviewMutation.mutateAsync({ applicationId: application.applicationId, status: 'approved' });
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) {
      return;
    }

    await reviewMutation.mutateAsync({
      applicationId: rejectTarget.applicationId,
      status: 'rejected',
      rejectionReason: reason,
    });
    setRejectTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Duyệt hồ sơ host</h1>
        <p className="mt-1 text-gray-600">Tách quy trình host ra khỏi hồ sơ người dùng để admin duyệt, phản hồi và theo dõi rõ ràng hơn.</p>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error.message}</p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Tổng hồ sơ" value={stats.total} icon={Building2} variant="default" />
        <StatsCard title="Chờ duyệt" value={stats.submitted} icon={Clock3} variant="warning" />
        <StatsCard title="Đã phê duyệt" value={stats.approved} icon={ShieldCheck} variant="success" />
        <StatsCard title="Cần bổ sung lại" value={stats.rejected} icon={XCircle} variant="warning" />
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as HostApplicationStatus | 'all')}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="rounded-2xl border-dashed shadow-none">
          <CardContent className="py-14 text-center text-sm text-slate-500">Chưa có hồ sơ host nào trong bộ lọc hiện tại.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <ApplicationCard
              key={application.applicationId}
              application={application}
              onOpen={setSelectedApplication}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              isApproving={reviewMutation.isPending}
            />
          ))}
        </div>
      )}

      <Dialog open={Boolean(selectedApplication)} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedApplication?.userName || 'Chi tiết hồ sơ host'}</DialogTitle>
          </DialogHeader>
          {selectedApplication ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin hồ sơ</CardTitle>
                  <CardDescription>{getHostApplicationStatusLabel(selectedApplication.status)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <p><span className="font-medium">Số điện thoại:</span> {selectedApplication.phone || selectedApplication.userPhone || 'Chưa có'}</p>
                  <p><span className="font-medium">Địa chỉ:</span> {selectedApplication.address || 'Chưa có'}</p>
                  <p><span className="font-medium">Số lượng tài sản:</span> {selectedApplication.propertyCount ?? 'Chưa có'}</p>
                  <p><span className="font-medium">Kinh nghiệm:</span> {selectedApplication.experience || 'Chưa mô tả'}</p>
                  <p><span className="font-medium">Mô tả:</span> {selectedApplication.description || 'Chưa mô tả thêm'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin review</CardTitle>
                  <CardDescription>Nguồn: {selectedApplication.source}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <p><span className="font-medium">Gửi lúc:</span> {formatDateTime(selectedApplication.submittedAt)}</p>
                  <p><span className="font-medium">Xử lý lúc:</span> {formatDateTime(selectedApplication.reviewedAt)}</p>
                  <p><span className="font-medium">Người xử lý:</span> {selectedApplication.reviewedByName || 'Chưa có'}</p>
                  {selectedApplication.rejectionReason ? <p><span className="font-medium">Lý do từ chối:</span> {selectedApplication.rejectionReason}</p> : null}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <RejectionDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
          }
        }}
        onConfirm={handleReject}
        type="user"
        itemName={rejectTarget?.userName}
      />
    </div>
  );
}
