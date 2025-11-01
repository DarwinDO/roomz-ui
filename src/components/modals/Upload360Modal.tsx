import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, CheckCircle2, X } from "lucide-react";

interface Upload360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function Upload360Modal({ isOpen, onClose, onComplete }: Upload360ModalProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFileUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSaveAndContinue = () => {
    onComplete();
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setUploadProgress(0);
      setIsUploading(false);
      setIsComplete(false);
    }, 300);
  };

  const handleCancel = () => {
    onClose();
    setTimeout(() => {
      setUploadProgress(0);
      setIsUploading(false);
      setIsComplete(false);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tải ảnh phòng 360°</DialogTitle>
          <DialogDescription>
            Chụp và tải lên đầy đủ các góc phòng để hoàn tất bước xác thực
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isComplete ? (
            <>
              {/* Upload Area */}
              <div
                onClick={handleFileUpload}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
                  isUploading
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50"
                }`}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {isUploading ? (
                    <Upload className="w-8 h-8 text-primary animate-pulse" />
                  ) : (
                    <Camera className="w-8 h-8 text-primary" />
                  )}
                </div>
                <h3 className="mb-2">
                  {isUploading ? "Đang tải lên..." : "Chọn hoặc kéo thả ảnh để tải lên"}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  hoặc kéo thả file trực tiếp vào khu vực này
                </p>
                <p className="text-xs text-gray-500">
                  Định dạng PNG, JPG, tối đa 10MB/ảnh (ít nhất 4 ảnh)
                </p>
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đang tải ảnh...</span>
                    <span className="text-primary">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Tips */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4">
                <p className="text-sm mb-2">📸 Mẹo chụp ảnh đẹp:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Chụp lần lượt bốn góc phòng để thấy toàn cảnh</li>
                  <li>• Ghi lại rõ vị trí cửa sổ, cửa ra vào và nội thất chính</li>
                  <li>• Bật đủ ánh sáng để ảnh sáng rõ, không bị tối</li>
                  <li>• Tránh rung tay hoặc ảnh mờ, nghiêng lệch</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Đang tải lên..." : "Tải ảnh lên"}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="mb-2">Đã tải ảnh thành công!</h3>
                <p className="text-sm text-gray-600">
                  Ảnh phòng của bạn đang được hệ thống kiểm tra và xác thực.
                </p>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveAndContinue}
                className="w-full bg-primary hover:bg-primary/90 rounded-full h-12"
              >
                Lưu và tiếp tục
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
