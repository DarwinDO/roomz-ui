/**
 * Admin VerificationsPage
 * Review and approve/reject CCCD verification requests
 * Uses real Supabase data + signed URLs for secure image viewing
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Clock, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePendingVerifications, useReviewVerification } from '@/hooks/useVerification';
import { getSignedImageUrl, type VerificationRequest, type VerificationStatus } from '@/services/verification';

export default function VerificationsPage() {
  const [tab, setTab] = useState<VerificationStatus | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const statusFilter = tab === 'all' ? undefined : tab;
  const { data: verifications = [], isLoading } = usePendingVerifications(statusFilter);
  const reviewMutation = useReviewVerification();

  // Open detail modal with signed URLs
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

  const handleApprove = (id: string) => {
    reviewMutation.mutate(
      { requestId: id, status: 'approved' },
      { onSuccess: () => setSelectedRequest(null) }
    );
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate(
      {
        requestId: selectedRequest.id,
        status: 'rejected',
        rejectionReason: rejectionReason || 'Giấy tờ không rõ ràng',
      },
      {
        onSuccess: () => {
          setSelectedRequest(null);
          setRejectDialogOpen(false);
          setRejectionReason('');
        },
      }
    );
  };

  const closeDetail = () => {
    setSelectedRequest(null);
    setFrontImageUrl(null);
    setBackImageUrl(null);
  };

  const statusBadge = (status: VerificationStatus) => {
    const config = {
      pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-700' },
    };
    const c = config[status];
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const pendingCount = verifications.filter(v => v.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Yêu cầu xác thực</h1>
        <p className="text-gray-600 mt-1">Duyệt CCCD từ người dùng</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Chờ duyệt {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="w-4 h-4 mr-2" />
            Đã duyệt
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="w-4 h-4 mr-2" />
            Từ chối
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : verifications.length === 0 ? (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không có yêu cầu nào</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {verifications.map((req) => (
                <Card key={req.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={req.user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {req.user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{req.user?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{req.user?.email || ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {new Date(req.submitted_at).toLocaleDateString('vi-VN')}
                      </span>
                      {statusBadge(req.status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetail(req)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                      {req.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            disabled={reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(req);
                              setRejectDialogOpen(true);
                            }}
                            disabled={reviewMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal with Signed URL images + Watermark */}
      <Dialog open={!!selectedRequest && !rejectDialogOpen} onOpenChange={closeDetail}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>CCCD — {selectedRequest?.user?.full_name || 'N/A'}</DialogTitle>
            <DialogDescription>
              Ngày gửi: {selectedRequest && new Date(selectedRequest.submitted_at).toLocaleDateString('vi-VN')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {loadingImages ? (
              <>
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              </>
            ) : (
              <>
                {/* Front with watermark */}
                <div className="relative border rounded-lg overflow-hidden">
                  <p className="text-xs text-gray-500 p-2 bg-gray-50">Mặt trước</p>
                  {frontImageUrl ? (
                    <div className="relative">
                      <img src={frontImageUrl} alt="Mặt trước CCCD" className="w-full h-56 object-contain bg-white" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="text-red-500/20 font-bold text-2xl rotate-[-30deg] whitespace-nowrap">
                          ROOMZ VERIFICATION ONLY
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center text-gray-400">Không tải được ảnh</div>
                  )}
                </div>

                {/* Back with watermark */}
                <div className="relative border rounded-lg overflow-hidden">
                  <p className="text-xs text-gray-500 p-2 bg-gray-50">Mặt sau</p>
                  {backImageUrl ? (
                    <div className="relative">
                      <img src={backImageUrl} alt="Mặt sau CCCD" className="w-full h-56 object-contain bg-white" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="text-red-500/20 font-bold text-2xl rotate-[-30deg] whitespace-nowrap">
                          ROOMZ VERIFICATION ONLY
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center text-gray-400">Không tải được ảnh</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Rejection reason display */}
          {selectedRequest?.status === 'rejected' && selectedRequest.rejection_reason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Lý do từ chối:</strong> {selectedRequest.rejection_reason}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {selectedRequest?.status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
                disabled={reviewMutation.isPending}
              >
                Từ chối
              </Button>
              <Button
                onClick={() => handleApprove(selectedRequest.id)}
                disabled={reviewMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Phê duyệt
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
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
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="VD: Ảnh CCCD bị mờ, không đọc được số. Vui lòng chụp lại rõ hơn."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
