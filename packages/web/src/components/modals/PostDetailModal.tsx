import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Post, Comment } from "@/pages/community/types";
import { useComments, useCreateComment, useToggleLike, useReportPost } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onLike?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export function PostDetailModal({ isOpen, onClose, post, onLike, onEdit, onDelete }: PostDetailModalProps) {
  const { user } = useAuth();
  const isOwner = user?.id && post.user_id === user.id;
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch real comments
  const { data: comments, isLoading: commentsLoading, refetch } = useComments(post.id);
  const createCommentMutation = useCreateComment();
  const toggleLikeMutation = useToggleLike();
  const reportMutation = useReportPost();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCommentText("");
      setReplyingTo(null);
      setShowReportDialog(false);
      setReportReason("");
      setActiveImageIndex(null);
    }
  }, [isOpen]);

  // Handle like click
  const handleLike = () => {
    if (onLike) {
      onLike(post.id);
    } else {
      toggleLikeMutation.mutate(post.id);
    }
  };

  // Handle send comment
  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        postId: post.id,
        content: commentText.trim(),
        parentId: replyingTo?.id,
      });
      setCommentText("");
      setReplyingTo(null);
      refetch();
    } catch (error) {
      console.error("Failed to create comment:", error);
      alert(error instanceof Error ? error.message : "Không thể gửi bình luận");
    }
  };

  // Handle reply
  const handleReply = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
    setCommentText(`@${author} `);
    textareaRef.current?.focus();
  };

  // Handle report
  const handleReport = async () => {
    if (!reportReason.trim()) return;

    try {
      await reportMutation.mutateAsync({
        postId: post.id,
        reason: reportReason.trim(),
      });
      setShowReportDialog(false);
      setReportReason("");
      alert("Đã báo cáo bài viết. Cảm ơn bạn!");
    } catch (error) {
      console.error("Failed to report:", error);
      alert(error instanceof Error ? error.message : "Không thể báo cáo");
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "story":
        return "Chia sẻ";
      case "offer":
        return "Ưu đãi";
      case "qa":
        return "Hỏi đáp";
      case "tip":
        return "Mẹo";
      default:
        return type;
    }
  };

  // Get time ago helper
  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa đăng";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const isSubmitting = createCommentMutation.isPending;
  const activeImage = activeImageIndex !== null ? post.images[activeImageIndex] : null;

  const goToPreviousImage = () => {
    setActiveImageIndex((current) => {
      if (current === null) {
        return current;
      }

      return current === 0 ? post.images.length - 1 : current - 1;
    });
  };

  const goToNextImage = () => {
    setActiveImageIndex((current) => {
      if (current === null) {
        return current;
      }

      return current === post.images.length - 1 ? 0 : current + 1;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] p-0 flex flex-col overflow-hidden" style={{ borderRadius: "16px" }}>
        <VisuallyHidden>
          <DialogTitle>Chi tiết bài viết</DialogTitle>
          <DialogDescription>
            Xem và tương tác với bài viết của {post.author.name}
          </DialogDescription>
        </VisuallyHidden>

        {/* Phần A - Nội dung bài viết */}
        <div className="flex-1 overflow-y-auto px-6 pt-6">
          <div className="flex items-start gap-3 mb-6">
            <PremiumAvatar isPremium={post.author.isPremium ?? false} className="h-12 w-12">
              <AvatarImage src={post.author.avatar || undefined} alt="" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                {post.author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </PremiumAvatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm flex items-center gap-1">
                  {post.author.name}
                  {post.author.verified && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                </p>
                <span className="text-xs text-muted-foreground">• {post.author.role}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{getTimeAgo(post.created_at)}</span>
                <Badge className={getTypeColor(post.type)} variant="outline">
                  {getTypeLabel(post.type)}
                </Badge>
              </div>
            </div>
            {/* Owner menu or Report button */}
            {isOwner ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => { onEdit?.(post); onClose(); }}
                    className="cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm("Bạn có chắc muốn xóa bài viết này?")) {
                        onDelete?.(post.id);
                        onClose();
                      }
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa bài viết
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="w-4 h-4" />
              </Button>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">{post.content}</p>

          {post.images && post.images.length > 0 && (
            <div
              className={`grid gap-3 mb-6 ${post.images.length === 1
                ? "grid-cols-1"
                : post.images.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
                }`}
            >
              {post.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className="relative aspect-video overflow-hidden rounded-xl transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Xem ảnh ${index + 1} ở kích thước lớn`}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`Ảnh ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/0 transition-colors hover:bg-slate-950/12" />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 py-4 border-y mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 hover:text-primary transition-colors ${post.liked ? "text-primary" : "text-gray-600"}`}
            >
              <Heart className={`w-5 h-5 ${post.liked ? "fill-current" : ""}`} />
              <span>{post.likes_count}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Share2 className="w-5 h-5" />
              <span>{post.shares || 0}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-4">Bình luận ({comments?.length || 0})</h3>
            <div className="space-y-3">
              {commentsLoading ? (
                // Loading skeleton
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-muted rounded mb-2" />
                      <div className="h-3 w-full bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : !comments || comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Phần B - Ô nhập bình luận */}
        <div className="border-t bg-white px-6 py-4" style={{ borderTopColor: "#EAEAEA", borderTopWidth: "1px" }}>
          {replyingTo && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-gray-600">
                Đang trả lời <span className="text-primary">{replyingTo.author}</span>
              </span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setCommentText("");
                }}
                className="text-gray-400 hover:text-gray-600 ml-auto"
              >
                Hủy
              </button>
            </div>
          )}
          <div className="flex items-end gap-3">
            <Textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 min-h-[40px] max-h-[96px] resize-none overflow-y-auto"
              style={{ borderRadius: "12px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              rows={1}
              disabled={isSubmitting}
            />
            <Button
              onClick={handleSendComment}
              disabled={!commentText.trim() || isSubmitting}
              size="icon"
              className="h-10 w-10 shrink-0"
              style={{ borderRadius: "12px", backgroundColor: commentText.trim() && !isSubmitting ? "#1557FF" : undefined }}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {activeImage ? (
          <div className="absolute inset-0 z-50 flex flex-col bg-slate-950/88 p-4 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-white">
                Ảnh {activeImageIndex! + 1}/{post.images.length}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-white hover:bg-white/12 hover:text-white"
                onClick={() => setActiveImageIndex(null)}
                aria-label="Đóng xem ảnh"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-1 items-center justify-center gap-3">
              {post.images.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={goToPreviousImage}
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              ) : null}

              <img
                src={activeImage}
                alt={`Ảnh ${activeImageIndex! + 1} của bài viết ${post.title}`}
                className="max-h-full max-w-full rounded-[24px] object-contain shadow-[0_30px_80px_rgba(15,23,42,0.42)]"
              />

              {post.images.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={goToNextImage}
                  aria-label="Ảnh kế tiếp"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              ) : null}
            </div>

            {post.images.length > 1 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {post.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl border transition-all ${
                      index === activeImageIndex
                        ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.15)]"
                        : "border-white/20 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Mở ảnh ${index + 1}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Report Dialog */}
        {showReportDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <h3 className="font-semibold mb-4">Báo cáo bài viết</h3>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Lý do báo cáo..."
                className="mb-4 min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReportDialog(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleReport}
                  disabled={!reportReason.trim() || reportMutation.isPending}
                  className="flex-1"
                >
                  {reportMutation.isPending ? "Đang gửi..." : "Gửi"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CommentItemProps {
  comment: Comment;
  onReply: (id: string, author: string) => void;
  isReply?: boolean;
}

function CommentItem({ comment, onReply, isReply = false }: CommentItemProps) {
  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa đăng";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className={isReply ? "ml-4" : ""}>
      <div className="flex gap-3">
        <PremiumAvatar isPremium={comment.author.isPremium ?? false} className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.avatar || undefined} alt="" />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs">
            {comment.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </PremiumAvatar>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm truncate">{comment.author.name}</p>
            </div>
            <p className="text-sm text-gray-700 break-words whitespace-pre-line">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-2 px-2">
            <span className="text-xs text-gray-400">{getTimeAgo(comment.created_at)}</span>

            {!isReply && (
              <button
                onClick={() => onReply(comment.id, comment.author.name)}
                className="text-xs text-gray-500 hover:text-primary transition-colors"
              >
                Trả lời
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );
}
