/**
 * StudentCardVerificationPage
 * Student ID card upload — mirrors VerificationPage flow for CCCD.
 * Requires front + back images; submitted as document_type = 'student_card'.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  GraduationCap,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Loader2,
  ImageIcon,
  X,
} from 'lucide-react';
import { useMyStudentCardStatus, useSubmitStudentCardVerification } from '@/hooks/useVerification';

export default function StudentCardVerificationPage() {
  const navigate = useNavigate();
  const { data: status, isLoading } = useMyStudentCardStatus();
  const submitMutation = useSubmitStudentCardVerification();

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const currentStatus = status?.status ?? 'unverified';
  const isVerified = currentStatus === 'approved';
  const isPending = currentStatus === 'pending';
  const isRejected = currentStatus === 'rejected';
  const isRevoked = currentStatus === 'revoked';
  const canUpload = !isPending && !isVerified;

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileDrop = useCallback(
    (side: 'front' | 'back') =>
      (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        if (side === 'front') {
          setFrontPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return preview; });
          setFrontFile(file);
        } else {
          setBackPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return preview; });
          setBackFile(file);
        }
      },
    [],
  );

  const dropzoneOpts = {
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: !canUpload,
  };

  const frontDropzone = useDropzone({ ...dropzoneOpts, onDrop: handleFileDrop('front') });
  const backDropzone = useDropzone({ ...dropzoneOpts, onDrop: handleFileDrop('back') });

  const clearFile = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontFile(null);
      if (frontPreview) { URL.revokeObjectURL(frontPreview); setFrontPreview(null); }
    } else {
      setBackFile(null);
      if (backPreview) { URL.revokeObjectURL(backPreview); setBackPreview(null); }
    }
  };

  const handleSubmit = () => {
    if (!frontFile || !backFile) return;
    submitMutation.mutate(
      { frontFile, backFile },
      { onSuccess: () => { setFrontFile(null); setBackFile(null); setFrontPreview(null); setBackPreview(null); } },
    );
  };

  const progress = frontFile && backFile ? 100 : frontFile || backFile ? 50 : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const heroIcon = isVerified ? (
    <CheckCircle className="h-10 w-10 text-green-600" />
  ) : isPending ? (
    <Clock className="h-10 w-10 text-yellow-600" />
  ) : isRejected || isRevoked ? (
    <XCircle className="h-10 w-10 text-red-600" />
  ) : (
    <GraduationCap className="h-10 w-10 text-white" />
  );

  const heroBg = isVerified
    ? 'bg-green-100'
    : isPending
      ? 'bg-yellow-100'
      : isRejected || isRevoked
        ? 'bg-red-100'
        : 'bg-gradient-to-br from-primary to-secondary';

  const heroTitle = isVerified
    ? 'Đã xác thực thẻ sinh viên ✓'
    : isPending
      ? 'Đang chờ duyệt'
      : isRevoked
        ? 'Đã bị gỡ xác thực'
        : isRejected
          ? 'Bị từ chối'
          : 'Xác thực thẻ sinh viên';

  const heroDesc = isVerified
    ? 'Thẻ sinh viên của bạn đã được xác thực. Bạn có thể nhận ưu đãi sinh viên trên RommZ.'
    : isPending
      ? 'Yêu cầu xác thực đang được xem xét. Chúng tôi sẽ phản hồi trong vòng 24 giờ.'
      : isRevoked
        ? 'Trạng thái xác thực trước đó đã bị gỡ. Bạn có thể xem lý do bên dưới và gửi lại.'
        : isRejected
          ? 'Yêu cầu xác thực trước đó không được chấp nhận. Vui lòng gửi lại.'
          : 'Tải lên ảnh 2 mặt thẻ sinh viên để xác thực và nhận ưu đãi dành riêng cho sinh viên.';

  return (
    <div lang="vi" className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 pb-20 md:pb-8">
      {/* Header */}
      <div className="scroll-lock-shell sticky top-0 z-40 border-b border-border bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
            aria-label="Quay lại"
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h3 className="ml-3">Xác thực thẻ sinh viên</h3>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Hero Card */}
        <Card className="rounded-3xl border-0 bg-white p-8 text-center shadow-lg">
          <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl ${heroBg}`}>
            {heroIcon}
          </div>
          <h1 className="mb-3">{heroTitle}</h1>
          <p className="mx-auto mb-4 max-w-xl text-gray-600">{heroDesc}</p>
          {isVerified && (
            <Badge className="border-0 bg-green-100 px-4 py-2 text-base text-green-700">
              Đã xác thực sinh viên
            </Badge>
          )}
          {isPending && (
            <Badge className="border-0 bg-yellow-100 px-4 py-2 text-base text-yellow-700">
              Đang chờ admin duyệt
            </Badge>
          )}
          {isRevoked && (
            <Badge className="border-0 bg-red-100 px-4 py-2 text-base text-red-700">
              Quản trị viên đã gỡ xác thực
            </Badge>
          )}
        </Card>

        {/* Rejection reason */}
        {(isRejected || isRevoked) && status?.rejection_reason && (
          <Card className="rounded-2xl border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="font-medium text-red-700">
                  {isRevoked ? 'Lý do gỡ xác thực' : 'Lý do từ chối'}
                </p>
                <p className="mt-1 text-sm text-red-600">{status.rejection_reason}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Upload Form */}
        {canUpload && (
          <Card className="rounded-3xl border-0 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3>Tải lên ảnh thẻ sinh viên</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {(
                [
                  { side: 'front' as const, label: 'Mặt trước thẻ SV', preview: frontPreview, dropzone: frontDropzone, ariaLabel: 'Tải ảnh mặt trước thẻ SV' },
                  { side: 'back' as const, label: 'Mặt sau thẻ SV', preview: backPreview, dropzone: backDropzone, ariaLabel: 'Tải ảnh mặt sau thẻ SV' },
                ] as const
              ).map(({ side, label, preview, dropzone, ariaLabel }) => (
                <div key={side}>
                  <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>
                  {preview ? (
                    <div className="relative overflow-hidden rounded-xl border-2 border-primary/30">
                      <img src={preview} alt={label} className="h-48 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => clearFile(side)}
                        onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
                        aria-label={`Xóa ${label}`}
                        className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition hover:bg-black/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      {...dropzone.getRootProps()}
                      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                        dropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                      }`}
                    >
                      <input aria-label={ariaLabel} {...dropzone.getInputProps()} />
                      <ImageIcon className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                      <p className="text-sm text-gray-500">Kéo thả hoặc bấm để chọn ảnh</p>
                      <p className="mt-1 text-xs text-gray-400">JPG, PNG • Tối đa 5MB</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">Tiến độ</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!frontFile || !backFile || submitMutation.isPending}
              className="mt-6 h-12 w-full rounded-xl text-base"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang tải lên và nén ảnh...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Gửi xác thực thẻ sinh viên
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Info */}
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-secondary/10 to-primary/10 p-6">
          <h3 className="mb-4 text-center">Thông tin xác thực</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'Chỉ cần thẻ sinh viên còn hiệu lực',
              'Ảnh được mã hóa và lưu trữ an toàn',
              'Chỉ admin được xem ảnh khi duyệt',
              'Hỗ trợ giảm giá dịch vụ và Local Passport',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
