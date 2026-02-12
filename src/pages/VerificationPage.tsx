/**
 * VerificationPage
 * CCCD upload for identity verification
 * Status-based UI: unverified → upload, pending → waiting, rejected → re-upload, verified → done
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ShieldCheck,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Loader2,
  ImageIcon,
  X,
} from 'lucide-react';
import { useMyVerificationStatus, useSubmitVerification } from '@/hooks/useVerification';

export default function VerificationPage() {
  const navigate = useNavigate();
  const { data: verificationStatus, isLoading } = useMyVerificationStatus();
  const submitMutation = useSubmitVerification();

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  // Determine current state
  const currentStatus = verificationStatus?.status || 'unverified';
  const isVerified = currentStatus === 'approved';
  const isPending = currentStatus === 'pending';
  const isRejected = currentStatus === 'rejected';
  const canUpload = !isPending && !isVerified;

  const handleFileDrop = useCallback((side: 'front' | 'back') => (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    if (side === 'front') {
      setFrontFile(file);
      setFrontPreview(preview);
    } else {
      setBackFile(file);
      setBackPreview(preview);
    }
  }, []);

  const frontDropzone = useDropzone({
    onDrop: handleFileDrop('front'),
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: !canUpload,
  });

  const backDropzone = useDropzone({
    onDrop: handleFileDrop('back'),
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: !canUpload,
  });

  const handleSubmit = () => {
    if (!frontFile || !backFile) return;
    submitMutation.mutate({ frontFile, backFile });
  };

  const clearFile = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontFile(null);
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      setFrontPreview(null);
    } else {
      setBackFile(null);
      if (backPreview) URL.revokeObjectURL(backPreview);
      setBackPreview(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8 min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="ml-3">Xác thực danh tính</h3>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Card */}
        <Card className="p-8 rounded-3xl bg-white text-center border-0 shadow-lg">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isVerified ? 'bg-green-100' : isPending ? 'bg-yellow-100' : isRejected ? 'bg-red-100' : 'bg-gradient-to-br from-primary to-secondary'
            }`}>
            {isVerified ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : isPending ? (
              <Clock className="w-10 h-10 text-yellow-600" />
            ) : isRejected ? (
              <XCircle className="w-10 h-10 text-red-600" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="mb-3">
            {isVerified ? 'Đã xác thực ✓' : isPending ? 'Đang chờ duyệt' : isRejected ? 'Bị từ chối' : 'Xác thực CCCD'}
          </h1>
          <p className="text-gray-600 mb-4 max-w-xl mx-auto">
            {isVerified
              ? 'Tài khoản của bạn đã được xác thực. Bạn có thể sử dụng đầy đủ các tính năng.'
              : isPending
                ? 'Yêu cầu xác thực đang được xem xét. Chúng tôi sẽ phản hồi trong vòng 24 giờ.'
                : isRejected
                  ? 'Yêu cầu xác thực trước đó không được chấp nhận. Vui lòng gửi lại.'
                  : 'Tải lên ảnh chụp 2 mặt CCCD để xác thực danh tính. Ảnh sẽ được bảo mật tuyệt đối.'
            }
          </p>
          {isVerified && (
            <Badge className="bg-green-100 text-green-700 px-4 py-2 text-base border-0">
              Tick xanh đã kích hoạt
            </Badge>
          )}
          {isPending && (
            <Badge className="bg-yellow-100 text-yellow-700 px-4 py-2 text-base border-0">
              Đang chờ admin duyệt
            </Badge>
          )}
        </Card>

        {/* Rejection reason */}
        {isRejected && verificationStatus?.rejection_reason && (
          <Card className="p-4 rounded-2xl border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-700">Lý do từ chối</p>
                <p className="text-sm text-red-600 mt-1">{verificationStatus.rejection_reason}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Upload Form */}
        {canUpload && (
          <Card className="p-6 rounded-3xl bg-white border-0 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-primary" />
              <h3>Tải lên ảnh CCCD</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Front side */}
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700">Mặt trước CCCD</p>
                {frontPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary/30">
                    <img src={frontPreview} alt="Mặt trước" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => clearFile('front')}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    {...frontDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${frontDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                      }`}
                  >
                    <input {...frontDropzone.getInputProps()} />
                    <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Kéo thả hoặc bấm để chọn ảnh</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG • Tối đa 5MB</p>
                  </div>
                )}
              </div>

              {/* Back side */}
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700">Mặt sau CCCD</p>
                {backPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary/30">
                    <img src={backPreview} alt="Mặt sau" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => clearFile('back')}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    {...backDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${backDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                      }`}
                  >
                    <input {...backDropzone.getInputProps()} />
                    <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Kéo thả hoặc bấm để chọn ảnh</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG • Tối đa 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Tiến độ</span>
                <span className="text-sm font-medium">
                  {frontFile && backFile ? '100%' : frontFile || backFile ? '50%' : '0%'}
                </span>
              </div>
              <Progress value={frontFile && backFile ? 100 : frontFile || backFile ? 50 : 0} className="h-2" />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!frontFile || !backFile || submitMutation.isPending}
              className="w-full mt-6 rounded-xl h-12 text-base"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang tải lên và nén ảnh...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Gửi xác thực
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Security notice */}
        <Card className="p-6 rounded-3xl bg-gradient-to-br from-secondary/10 to-primary/10 border-0">
          <h3 className="mb-4 text-center">Bảo mật thông tin</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              'Ảnh CCCD được mã hóa và lưu trữ an toàn',
              'Chỉ admin được phép xem ảnh khi duyệt',
              'Link ảnh tự hủy sau 60 giây',
              'Không chia sẻ thông tin với bên thứ 3',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
