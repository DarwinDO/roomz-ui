import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Upload, X, Eye, Loader2 } from "lucide-react";
import { useCreatePost, useUpdatePost } from "@/hooks/useCommunity";
import type { CreatePostData, Post } from "@/pages/community/types";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  editPost?: Post | null;
}

type CommunityPostType = CreatePostData["type"];

export function CreatePostModal({ isOpen, onClose, onPostCreated, editPost }: CreatePostModalProps) {
  const isEditMode = !!editPost;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"story" | "offer" | "qa" | "tip">("story");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();

  // Pre-fill form when editing
  useEffect(() => {
    if (isOpen && editPost) {
      setTitle(editPost.title || "");
      setContent(editPost.content || "");
      setPostType(editPost.type || "story");
      setExistingImages(editPost.images || []);
      setImageFiles([]);
      setPreviewUrls([]);
      setShowPreview(false);
    }
  }, [isOpen, editPost]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;
    if (totalImages > 3) {
      alert("Tối đa 3 ảnh");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Revoke old URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    // Create new preview URLs for new files only
    setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);

    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);

    setImageFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const resetState = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setTitle("");
    setContent("");
    setPostType("story");
    setImageFiles([]);
    setPreviewUrls([]);
    setExistingImages([]);
    setShowPreview(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    try {
      if (isEditMode && editPost) {
        await updatePostMutation.mutateAsync({
          postId: editPost.id,
          data: {
            type: postType,
            title: title.trim(),
            content: content.trim(),
          },
          imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
          existingImages,
        });
      } else {
        await createPostMutation.mutateAsync({
          data: {
            type: postType,
            title: title.trim(),
            content: content.trim(),
          },
          imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
        });
      }
      handleClose();
      onPostCreated();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} post:`, error);
      alert(error instanceof Error ? error.message : `Không thể ${isEditMode ? 'cập nhật' : 'đăng'} bài`);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "story":
        return "bg-secondary/10 text-secondary";
      case "offer":
        return "bg-primary/10 text-primary";
      case "qa":
        return "bg-purple-100 text-purple-600";
      case "tip":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const isLoading = createPostMutation.isPending || updatePostMutation.isPending;
  const allPreviewImages = [...existingImages, ...previewUrls];
  const totalImageCount = existingImages.length + imageFiles.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-type">Loại bài viết</Label>
              <Select value={postType} onValueChange={(value) => setPostType(value as CommunityPostType)}>
                <SelectTrigger id="post-type" className="rounded-xl">
                  <SelectValue placeholder="Chọn loại bài viết" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">Chia sẻ trải nghiệm</SelectItem>
                  <SelectItem value="offer">Ưu đãi / Tin cho thuê</SelectItem>
                  <SelectItem value="qa">Hỏi đáp cộng đồng</SelectItem>
                  <SelectItem value="tip">Mẹo hay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Đặt tiêu đề thật nổi bật..."
                className="rounded-xl"
                maxLength={100}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">{title.length}/100 ký tự</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Nội dung</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ câu chuyện, thông tin hoặc câu hỏi của bạn..."
                className="rounded-xl min-h-32"
                maxLength={1000}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">{content.length}/1000 ký tự</p>
            </div>

            <div className="space-y-2">
              <Label>Hình ảnh (không bắt buộc)</Label>
              <div className="grid grid-cols-4 gap-3">
                {/* Existing images (from edit mode) */}
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden group">
                    <ImageWithFallback src={url} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveExistingImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isLoading}
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {/* New uploaded images */}
                {previewUrls.map((url, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden group">
                    <ImageWithFallback src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isLoading}
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {totalImageCount < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2"
                    disabled={isLoading}
                    type="button"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Tải ảnh</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Tối đa 3 ảnh, max 2MB sau khi nén</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <Label htmlFor="preview-toggle" className="cursor-pointer">
                  Xem trước trước khi đăng
                </Label>
              </div>
              <Switch
                id="preview-toggle"
                checked={showPreview}
                onCheckedChange={setShowPreview}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1 rounded-full h-12" disabled={isLoading}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? "Đang cập nhật..." : "Đang đăng..."}
                  </>
                ) : (
                  isEditMode ? "Cập nhật" : "Đăng bài"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-4 rounded-xl">
              <p className="text-sm text-center mb-2">Xem trước</p>
              <div className="bg-white p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full" />
                  <div>
                    <p className="text-sm">Bạn</p>
                    <p className="text-xs text-gray-500">Người dùng</p>
                  </div>
                  <Badge className={getTypeColor(postType)} variant="outline">
                    {postType === "story"
                      ? "Chia sẻ"
                      : postType === "offer"
                        ? "Ưu đãi"
                        : postType === "qa"
                          ? "Hỏi đáp"
                          : "Mẹo"}
                  </Badge>
                </div>

                <h3 className="mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{content}</p>

                {allPreviewImages.length > 0 && (
                  <div
                    className={`grid gap-2 ${allPreviewImages.length === 1
                      ? "grid-cols-1"
                      : allPreviewImages.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-3"
                      }`}
                  >
                    {allPreviewImages.map((url, index) => (
                      <div key={index} className="relative aspect-video overflow-hidden rounded-xl">
                        <ImageWithFallback src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1 rounded-full h-12" disabled={isLoading}>
                Quay lại chỉnh sửa
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? "Đang cập nhật..." : "Đang đăng..."}
                  </>
                ) : (
                  isEditMode ? "Cập nhật" : "Đăng bài"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
