import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  GraduationCap,
  History,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  getSignedImageUrl,
  type ManagedVerificationType,
  type VerificationRequest,
  type VerificationStatus,
} from '@/services/verification';
import {
  usePendingVerifications,
  useReviewVerification,
  useRevokeVerification,
  useVerificationAuditLog,
  useVerifiedUsers,
} from '@/hooks/useVerification';

type AdminVerificationTab = 'requests' | 'verified' | 'audit';
type RequestFilter = VerificationStatus | 'all';

const REQUEST_FILTERS: RequestFilter[] = ['all', 'pending', 'approved', 'rejected'];

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Chưa có';
  }

  return new Date(value).toLocaleString('vi-VN');
}

function getRequestStatusBadge(status: VerificationStatus) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700">Đã duyệt</Badge>;
    case 'rejected':
      return <Badge className="bg-rose-100 text-rose-700">Từ chối</Badge>;
    default:
      return <Badge className="bg-amber-100 text-amber-700">Chờ duyệt</Badge>;
  }
}

function getRequestFilterLabel(filter: RequestFilter) {
  switch (filter) {
    case 'pending':
      return 'Chờ duyệt';
    case 'approved':
      return 'Đã duyệt';
    case 'rejected':
      return 'Từ chối';
    default:
      return 'Tất cả';
  }
}

function getVerificationTypeLabel(type: ManagedVerificationType | string) {
  switch (type) {
    case 'student_card':
      return 'Thẻ sinh viên';
    case 'id_card':
      return 'CCCD';
    default:
      return type;
  }
}

function getSourceHintLabel(sourceHint: string | null) {
  switch (sourceHint) {
    case 'legacy_manual':
      return 'Legacy/manual';
    case 'backfill_verification_request':
      return 'Backfill từ request';
    case 'verification_requests_trigger':
      return 'Duyệt từ request';
    default:
      return 'Audit event';
  }
}

function getAuditEventBadge(eventType: string) {
  switch (eventType) {
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700">Phê duyệt</Badge>;
    case 'rejected':
      return <Badge className="bg-rose-100 text-rose-700">Từ chối</Badge>;
    case 'revoked':
      return <Badge className="bg-slate-200 text-slate-700">Gỡ xác thực</Badge>;
    default:
      return <Badge variant="outline">{eventType}</Badge>;
  }
}

export default function VerificationsPage() {
  const [tab, setTab] = useState<AdminVerificationTab>('requests');
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<{
    userId: string;
    userName: string;
    verificationType: ManagedVerificationType;
  } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const requestStatusFilter = requestFilter === 'all' ? undefined : requestFilter;
  const requestsQuery = usePendingVerifications(requestStatusFilter);
  const verifiedUsersQuery = useVerifiedUsers();
  const auditLogQuery = useVerificationAuditLog(100);
  const reviewMutation = useReviewVerification();
  const revokeMutation = useRevokeVerification();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage]);

  const requestStats = useMemo(() => {
    const rows = requestsQuery.data ?? [];
    return {
      total: rows.length,
      pending: rows.filter((row) => row.status === 'pending').length,
      approved: rows.filter((row) => row.status === 'approved').length,
      rejected: rows.filter((row) => row.status === 'rejected').length,
    };
  }, [requestsQuery.data]);

  const verifiedCount = verifiedUsersQuery.data?.length ?? 0;
  const auditCount = auditLogQuery.data?.length ?? 0;

  const handleViewDetail = async (request: VerificationRequest) => {
    setSelectedRequest(request);
    setLoadingImages(true);
    setFrontImageUrl(null);
    setBackImageUrl(null);

    try {
      const [front, back] = await Promise.all([
        getSignedImageUrl(request.front_image_path),
        getSignedImageUrl(request.back_image_path),
      ]);
      setFrontImageUrl(front);
      setBackImageUrl(back);
    } catch {
      toast.error('Lỗi tải ảnh CCCD');
    } finally {
      setLoadingImages(false);
    }
  };

  const closeDetail = () => {
    setSelectedRequest(null);
    setFrontImageUrl(null);
    setBackImageUrl(null);
  };

  const handleApprove = (requestId: string) => {
    reviewMutation.mutate(
      { requestId, status: 'approved' },
      {
        onSuccess: () => {
          if (selectedRequest?.id === requestId) {
            closeDetail();
          }
        },
      },
    );
  };

  const handleReject = () => {
    if (!selectedRequest) {
      return;
    }

    reviewMutation.mutate(
      {
        requestId: selectedRequest.id,
        status: 'rejected',
        rejectionReason: rejectionReason || 'Giấy tờ không rõ ràng',
      },
      {
        onSuccess: () => {
          closeDetail();
          setRejectDialogOpen(false);
          setRejectionReason('');
        },
      },
    );
  };

  const handleOpenRevoke = (
    userId: string,
    userName: string,
    verificationType: ManagedVerificationType,
  ) => {
    setRevokeTarget({ userId, userName, verificationType });
    setRevokeReason('');
    setRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (!revokeTarget) {
      return;
    }

    revokeMutation.mutate(
      {
        userId: revokeTarget.userId,
        verificationType: revokeTarget.verificationType,
        reason: revokeReason || 'Quản trị viên yêu cầu gỡ trạng thái xác thực',
      },
      {
        onSuccess: () => {
          setRevokeDialogOpen(false);
          setRevokeTarget(null);
          setRevokeReason('');
        },
      },
    );
  };

  const activeRequests = requestsQuery.data ?? [];
  const verifiedUsers = verifiedUsersQuery.data ?? [];
  const auditLog = auditLogQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Quản lý xác thực</h1>
          <p className="mt-1 text-sm text-slate-500">
            Duyệt yêu cầu CCCD, theo dõi người dùng đang verified và lưu audit mỗi lần admin gỡ xác thực.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="rounded-2xl border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Request</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{requestStats.total}</p>
          </Card>
          <Card className="rounded-2xl border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Chờ duyệt</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">{requestStats.pending}</p>
          </Card>
          <Card className="rounded-2xl border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Đang verified</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{verifiedCount}</p>
          </Card>
          <Card className="rounded-2xl border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Audit events</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{auditCount}</p>
          </Card>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as AdminVerificationTab)}>
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="requests">
            <Clock className="mr-2 h-4 w-4" />
            Yêu cầu
          </TabsTrigger>
          <TabsTrigger value="verified">
            <BadgeCheck className="mr-2 h-4 w-4" />
            Đang xác thực
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="mr-2 h-4 w-4" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {REQUEST_FILTERS.map((filterValue) => (
              <Button
                key={filterValue}
                variant={filterValue === requestFilter ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setRequestFilter(filterValue)}
              >
                {getRequestFilterLabel(filterValue)}
              </Button>
            ))}
          </div>

          {requestsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeRequests.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-slate-300 p-10 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-900">Không có yêu cầu phù hợp</p>
              <p className="mt-2 text-sm text-slate-500">
                Bộ lọc hiện tại không có yêu cầu xác thực nào cần xử lý.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeRequests.map((request) => (
                <Card key={request.id} className="rounded-3xl border-slate-200 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={request.user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {request.user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-slate-950">
                            {request.user?.full_name || 'Không rõ người gửi'}
                          </p>
                          {getRequestStatusBadge(request.status)}
                          <Badge variant="outline" className="rounded-full">
                            {request.document_type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="truncate text-sm text-slate-500">
                          {request.user?.email || request.user_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>Gửi lúc {formatDateTime(request.submitted_at)}</span>
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => void handleViewDetail(request)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Xem hồ sơ
                      </Button>
                      {request.status === 'pending' ? (
                        <>
                          <Button
                            size="sm"
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                            disabled={reviewMutation.isPending}
                            onClick={() => handleApprove(request.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full"
                            disabled={reviewMutation.isPending}
                            onClick={() => {
                              setSelectedRequest(request);
                              setRejectionReason('');
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Từ chối
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4 pt-6">
          {verifiedUsersQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : verifiedUsers.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-slate-300 p-10 text-center">
              <BadgeCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-900">Chưa có người dùng nào đang verified</p>
              <p className="mt-2 text-sm text-slate-500">
                Tab này chỉ hiển thị người dùng còn đang giữ ít nhất một trạng thái xác thực.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {verifiedUsers.map((user) => (
                <Card key={user.user_id} className="rounded-3xl border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{user.full_name}</p>
                        <p className="truncate text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {getSourceHintLabel(user.source_hint)}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.id_card_verified ? (
                      <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                        <CreditCard className="mr-1 h-3.5 w-3.5" />
                        CCCD
                      </Badge>
                    ) : null}
                    {user.student_card_verified ? (
                      <Badge className="rounded-full bg-sky-100 text-sky-700">
                        <GraduationCap className="mr-1 h-3.5 w-3.5" />
                        Thẻ sinh viên
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lần duyệt gần nhất</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {formatDateTime(user.latest_approved_at)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {user.latest_approved_by_name || 'Không có reviewer'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lần gỡ gần nhất</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {formatDateTime(user.latest_revoke_at)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {user.latest_revoke_reason || 'Chưa từng bị gỡ'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.id_card_verified ? (
                      <Button
                        variant="destructive"
                        className="rounded-full"
                        size="sm"
                        onClick={() => handleOpenRevoke(user.user_id, user.full_name, 'id_card')}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Gỡ CCCD
                      </Button>
                    ) : null}
                    {user.student_card_verified ? (
                      <Button
                        variant="outline"
                        className="rounded-full border-slate-300 text-slate-700"
                        size="sm"
                        onClick={() => handleOpenRevoke(user.user_id, user.full_name, 'student_card')}
                      >
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Gỡ thẻ sinh viên
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 pt-6">
          {auditLogQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : auditLog.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-slate-300 p-10 text-center">
              <History className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-900">Chưa có audit event</p>
              <p className="mt-2 text-sm text-slate-500">
                Mỗi lần duyệt, từ chối hoặc gỡ xác thực sẽ xuất hiện ở đây.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {auditLog.map((event) => (
                <Card key={event.event_id} className="rounded-3xl border-slate-200 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{event.user_name || 'Không rõ người dùng'}</p>
                        {getAuditEventBadge(event.event_type)}
                        <Badge variant="outline" className="rounded-full">
                          {getVerificationTypeLabel(event.verification_type)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{event.user_email || event.user_id}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {event.reason || 'Không có ghi chú bổ sung'}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      <p>{formatDateTime(event.created_at)}</p>
                      <p className="mt-1">
                        Thực hiện bởi {event.performed_by_name || 'Hệ thống / backfill'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedRequest) && !rejectDialogOpen} onOpenChange={closeDetail}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>CCCD của {selectedRequest?.user?.full_name || 'người dùng'}</DialogTitle>
            <DialogDescription>
              Gửi lúc {selectedRequest ? formatDateTime(selectedRequest.submitted_at) : 'Chưa có'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            {loadingImages ? (
              <>
                <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-100">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
                <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-100">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              </>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Mặt trước
                  </p>
                  {frontImageUrl ? (
                    <div className="relative">
                      <img
                        src={frontImageUrl}
                        alt="Mặt trước CCCD"
                        className="h-64 w-full cursor-zoom-in bg-white object-contain"
                        onClick={() => setFullscreenImage(frontImageUrl)}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
                        <span className="rotate-[-30deg] whitespace-nowrap text-2xl font-bold text-red-500/20">
                          ROMMZ VERIFICATION ONLY
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-slate-400">
                      Không tải được ảnh
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Mặt sau
                  </p>
                  {backImageUrl ? (
                    <div className="relative">
                      <img
                        src={backImageUrl}
                        alt="Mặt sau CCCD"
                        className="h-64 w-full cursor-zoom-in bg-white object-contain"
                        onClick={() => setFullscreenImage(backImageUrl)}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
                        <span className="rotate-[-30deg] whitespace-nowrap text-2xl font-bold text-red-500/20">
                          ROMMZ VERIFICATION ONLY
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-slate-400">
                      Không tải được ảnh
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {selectedRequest?.status === 'rejected' && selectedRequest.rejection_reason ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <strong>Lý do từ chối:</strong> {selectedRequest.rejection_reason}
            </div>
          ) : null}

          {selectedRequest?.status === 'pending' ? (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                className="rounded-full"
                disabled={reviewMutation.isPending}
                onClick={() => {
                  setRejectionReason('');
                  setRejectDialogOpen(true);
                }}
              >
                Từ chối
              </Button>
              <Button
                className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                disabled={reviewMutation.isPending}
                onClick={() => handleApprove(selectedRequest.id)}
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Phê duyệt
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lý do từ chối</DialogTitle>
            <DialogDescription>
              Nhập lý do để người dùng biết cần bổ sung gì khi gửi lại.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Ví dụ: Ảnh CCCD bị mờ, vui lòng chụp lại rõ hơn."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={reviewMutation.isPending}
              onClick={handleReject}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gỡ trạng thái xác thực</DialogTitle>
            <DialogDescription>
              Hành động này có hiệu lực ngay và sẽ được ghi vào audit log. Người dùng cũng sẽ nhận thông báo.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-900">{revokeTarget?.userName || 'Người dùng'}</p>
            <p className="mt-1 text-sm text-slate-500">
              Loại xác thực: {getVerificationTypeLabel(revokeTarget?.verificationType || 'id_card')}
            </p>
          </div>
          <Textarea
            value={revokeReason}
            onChange={(event) => setRevokeReason(event.target.value)}
            placeholder="Nhập lý do gỡ xác thực để lưu audit và gửi thông báo cho người dùng."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setRevokeDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={revokeMutation.isPending}
              onClick={handleConfirmRevoke}
            >
              {revokeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldAlert className="mr-2 h-4 w-4" />
              )}
              Gỡ xác thực ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {fullscreenImage ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                const link = document.createElement('a');
                link.href = fullscreenImage;
                link.download = `cccd_${Date.now()}.jpg`;
                link.target = '_blank';
                link.click();
              }}
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                setFullscreenImage(null);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
            <span className="rotate-[-30deg] whitespace-nowrap text-4xl font-bold text-red-500/15">
              ROMMZ VERIFICATION ONLY
            </span>
          </div>

          <img
            src={fullscreenImage}
            alt="CCCD fullscreen"
            className="max-h-[90vh] max-w-[95vw] select-none object-contain"
            onClick={(event) => event.stopPropagation()}
            style={{ touchAction: 'pinch-zoom' }}
          />

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/50">
            Click bên ngoài hoặc nhấn ✕ để đóng
          </p>
        </div>
      ) : null}
    </div>
  );
}
