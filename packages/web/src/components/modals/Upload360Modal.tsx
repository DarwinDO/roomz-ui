import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, CheckCircle2, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts";
import { uploadMultiplePhotos, submitVerificationRequest } from "@/services/verification";
import { toast } from "sonner";

interface Upload360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function Upload360Modal({ isOpen, onClose, onComplete }: Upload360ModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} không phải là file ảnh`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error(`${file.name} vượt quá 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      
      // Create preview URLs
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrls(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để tải ảnh");
      return;
    }

    if (selectedFiles.length < 4) {
      toast.error("Vui lòng chọn ít nhất 4 ảnh");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      // Upload files to Supabase Storage
      const uploadedUrls = await uploadMultiplePhotos(user.id, selectedFiles, 'room_photos');

      // Submit verification request
      await submitVerificationRequest(user.id, 'room_photos', uploadedUrls);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsComplete(true);
      toast.success("Đã tải ảnh thành công!");
    } catch (error) {
      console.error("Upload error:", error);
      // Show detailed error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Không thể tải ảnh lên. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAndContinue = () => {
    onComplete();
    onClose();
    // Reset state after closing
    setTimeout(() => {
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadProgress(0);
      setIsUploading(false);
      setIsComplete(false);
    }, 300);
  };

  const handleCancel = () => {
    onClose();
    setTimeout(() => {
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadProgress(0);
      setIsUploading(false);
      setIsComplete(false);
    }, 300);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    // Create a synthetic event for handleFileSelect
    const input = fileInputRef.current;
    if (input) {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      input.files = dt.files;
      handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tải ảnh phòng 360°</DialogTitle>
          <DialogDescription>
            Chụp và tải lên đầy đủ các góc phòng để hoàn tất bước xác thực
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isComplete ? (
            <>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
                  isUploading
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50"
                }`}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-primary" />
                  )}
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {isUploading ? "Đang tải lên..." : "Chọn hoặc kéo thả ảnh"}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  Kéo thả file trực tiếp vào khu vực này
                </p>
                <p className="text-xs text-gray-500">
                  Định dạng PNG, JPG, tối đa 10MB/ảnh (ít nhất 4 ảnh)
                </p>
              </div>

              {/* Preview Grid */}
              {previewUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Đã chọn {selectedFiles.length} ảnh
                      {selectedFiles.length < 4 && (
                        <span className="text-yellow-600"> (cần thêm {4 - selectedFiles.length} ảnh)</span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Thêm ảnh
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        {!isUploading && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                <p className="text-sm font-medium mb-2">📸 Mẹo chụp ảnh đẹp:</p>
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
                  onClick={handleUpload}
                  disabled={isUploading || selectedFiles.length < 4}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Tải lên ({selectedFiles.length}/4)
                    </>
                  )}
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
                <h3 className="text-lg font-medium mb-2">Đã tải ảnh thành công!</h3>
                <p className="text-sm text-gray-600">
                  {selectedFiles.length} ảnh phòng của bạn đang được hệ thống kiểm tra và xác thực.
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
