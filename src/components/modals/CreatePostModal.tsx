import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Upload, X, Eye } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"story" | "offer" | "qa">("story");
  const [images, setImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleImageUpload = () => {
    const sampleImages = [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
    ];

    if (images.length < 4) {
      const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      setImages([...images, randomImage]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const resetState = () => {
    setTitle("");
    setContent("");
    setPostType("story");
    setImages([]);
    setShowPreview(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    onPostCreated({
      author: {
        name: "Bạn",
        role: "Sinh viên",
        verified: false,
      },
      type: postType,
      title: title.trim(),
      preview: content.substring(0, 150) + (content.length > 150 ? "..." : ""),
      content: content.trim(),
      images,
      liked: false,
    });

    handleClose();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "story":
        return "bg-secondary/10 text-secondary";
      case "offer":
        return "bg-primary/10 text-primary";
      case "qa":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bài viết mới</DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-type">Loại bài viết</Label>
              <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
                <SelectTrigger id="post-type" className="rounded-xl">
                  <SelectValue placeholder="Chọn loại bài viết" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">Chia sẻ trải nghiệm</SelectItem>
                  <SelectItem value="offer">Ưu đãi / Tin cho thuê</SelectItem>
                  <SelectItem value="qa">Hỏi đáp cộng đồng</SelectItem>
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
              />
              <p className="text-xs text-gray-500">{content.length}/1000 ký tự</p>
            </div>

            <div className="space-y-2">
              <Label>Hình ảnh (không bắt buộc)</Label>
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                    <ImageWithFallback src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <button
                    onClick={handleImageUpload}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Tải ảnh</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">Tối đa 4 ảnh</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <Label htmlFor="preview-toggle" className="cursor-pointer">Xem trước trước khi đăng</Label>
              </div>
              <Switch id="preview-toggle" checked={showPreview} onCheckedChange={setShowPreview} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1 rounded-full h-12">
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
              >
                "Đăng bài"
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
                    <p className="text-xs text-gray-500">Sinh viên</p>
                  </div>
                  <Badge className={getTypeColor(postType)} variant="outline">
                    {postType === "story" ? "Chia sẻ" : postType === "offer" ? "Ưu đãi" : "Hỏi đáp"}
                  </Badge>
                </div>

                <h3 className="mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{content}</p>

                {images.length > 0 && (
                  <div
                    className={`grid gap-2 ${
                      images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"
                    }`}
                  >
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-video overflow-hidden rounded-xl">
                        <ImageWithFallback src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1 rounded-full h-12">
                Quay lại chỉnh sửa
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12">
                Đăng bài
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

