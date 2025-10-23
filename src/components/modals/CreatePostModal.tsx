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
    // Simulate image upload - in a real app, this would use file input
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

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    const newPost = {
      author: {
        name: "Current User",
        role: "Student",
        verified: false,
      },
      type: postType,
      title: title.trim(),
      preview: content.substring(0, 150) + (content.length > 150 ? "..." : ""),
      content: content.trim(),
      images: images,
      liked: false,
    };

    onPostCreated(newPost);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setPostType("story");
    setImages([]);
    setShowPreview(false);
    onClose();
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
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6 py-4">
            {/* Post Type */}
            <div className="space-y-2">
              <Label htmlFor="post-type">Post Type</Label>
              <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
                <SelectTrigger id="post-type" className="rounded-xl">
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">Story - Share your experience</SelectItem>
                  <SelectItem value="offer">Offer - List a rental or service</SelectItem>
                  <SelectItem value="qa">Q&A - Ask the community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a catchy title..."
                className="rounded-xl"
                maxLength={100}
              />
              <p className="text-xs text-gray-500">{title.length}/100 characters</p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your story, details, or question..."
                className="rounded-xl min-h-32"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500">{content.length}/1000 characters</p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Images (Optional)</Label>
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                    <ImageWithFallback
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
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
                    <span className="text-xs text-gray-500">Upload</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">Maximum 4 images</p>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <Label htmlFor="preview-toggle" className="cursor-pointer">Preview before posting</Label>
              </div>
              <Switch
                id="preview-toggle"
                checked={showPreview}
                onCheckedChange={setShowPreview}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-full h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={showPreview ? () => setShowPreview(true) : handleSubmit}
                disabled={!title.trim() || !content.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
              >
                {showPreview ? "Preview" : "Post Now"}
              </Button>
            </div>
          </div>
        ) : (
          // Preview Mode
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-4 rounded-xl">
              <p className="text-sm text-center mb-2">Preview</p>
              <div className="bg-white p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full" />
                  <div>
                    <p className="text-sm">Current User</p>
                    <p className="text-xs text-gray-500">Student</p>
                  </div>
                  <Badge className={getTypeColor(postType)} variant="outline">
                    {postType === "story" ? "Story" : postType === "offer" ? "Offer" : "Q&A"}
                  </Badge>
                </div>

                <h3 className="mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-4">{content}</p>

                {images.length > 0 && (
                  <div className={`grid gap-2 ${
                    images.length === 1 ? "grid-cols-1" :
                    images.length === 2 ? "grid-cols-2" :
                    "grid-cols-3"
                  }`}>
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-video overflow-hidden rounded-xl">
                        <ImageWithFallback
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="flex-1 rounded-full h-12"
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
              >
                Publish Post
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
