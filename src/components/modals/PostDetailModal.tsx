import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Heart, MessageCircle, Share2, Send, ShieldCheck, MoreHorizontal } from "lucide-react";

interface Post {
  id: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
    verified?: boolean;
  };
  type: "story" | "offer" | "qa";
  title: string;
  preview: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  liked?: boolean;
}

interface Comment {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onLike: (postId: string) => void;
}

export function PostDetailModal({ isOpen, onClose, post, onLike }: PostDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Jordan Lee",
      role: "Student",
      content: "This is so helpful! Thanks for sharing your experience.",
      timestamp: "1 hour ago",
      likes: 12,
      replies: [
        {
          id: "1-1",
          author: post.author.name,
          role: post.author.role,
          content: "Glad you found it useful! Let me know if you have any questions.",
          timestamp: "45 mins ago",
          likes: 5,
        },
      ],
    },
    {
      id: "2",
      author: "Taylor Kim",
      role: "Host",
      content: "Great post! I'd add that it's also important to keep communication open with your roommates.",
      timestamp: "30 mins ago",
      likes: 8,
    },
  ]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendComment = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: "Current User",
      role: "Student",
      content: commentText.trim(),
      timestamp: "Just now",
      likes: 0,
    };

    if (replyingTo) {
      setComments(comments.map(comment => {
        if (comment.id === replyingTo.id) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newComment],
          };
        }
        return comment;
      }));
      setReplyingTo(null);
    } else {
      setComments([...comments, newComment]);
    }

    setCommentText("");
  };

  const handleReply = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
    setCommentText(`@${author} `);
    textareaRef.current?.focus();
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "story":
        return "Story";
      case "offer":
        return "Offer";
      case "qa":
        return "Q&A";
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl h-[90vh] p-0 flex flex-col overflow-hidden"
        style={{ borderRadius: '16px' }}
      >
        <VisuallyHidden>
          <DialogTitle>Post Details</DialogTitle>
          <DialogDescription>
            View and interact with post by {post.author.name}
          </DialogDescription>
        </VisuallyHidden>

        {/* [A] Post Header + Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pt-6">
          {/* Post Header */}
          <div className="flex items-start gap-3 mb-6">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                {post.author.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p>{post.author.name}</p>
                {post.author.verified && (
                  <ShieldCheck className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-gray-500">{post.author.role}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getTypeColor(post.type)} variant="outline">
                  {getTypeLabel(post.type)}
                </Badge>
                <span className="text-xs text-gray-400">{post.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <h2 className="mb-4">{post.title}</h2>
          <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">{post.content}</p>

          {/* Images */}
          {post.images.length > 0 && (
            <div className={`grid gap-3 mb-6 ${
              post.images.length === 1 ? "grid-cols-1" :
              post.images.length === 2 ? "grid-cols-2" :
              "grid-cols-2 md:grid-cols-3"
            }`}>
              {post.images.map((image, index) => (
                <div key={index} className="relative aspect-video overflow-hidden rounded-xl">
                  <ImageWithFallback
                    src={image}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* [B] Interaction Bar */}
          <div className="flex items-center gap-6 py-4 border-y mb-6">
            <button
              onClick={() => onLike(post.id)}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Heart className={`w-5 h-5 ${post.liked ? "fill-red-500 text-red-500" : ""}`} />
              <span>{post.likes}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span>{comments.length}</span>
            </div>
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <Share2 className="w-5 h-5" />
              <span>{post.shares}</span>
            </button>
          </div>

          {/* [C] Comments Area */}
          <div className="mb-6">
            <h3 className="mb-4">Comments ({comments.length})</h3>
            
            {/* CommentsList - Scrollable */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* CommentComposer - Fixed at Bottom */}
        <div 
          className="border-t bg-white px-6 py-4 pb-6"
          style={{ borderTopColor: '#EAEAEA', borderTopWidth: '1px' }}
        >
          {replyingTo && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-gray-600">Replying to <span className="text-primary">{replyingTo.author}</span></span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setCommentText("");
                }}
                className="text-gray-400 hover:text-gray-600 ml-auto"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-end gap-3">
            <Textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 min-h-[40px] max-h-[96px] resize-none overflow-y-auto"
              style={{ borderRadius: '12px' }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              rows={1}
            />
            <Button
              onClick={handleSendComment}
              disabled={!commentText.trim()}
              size="icon"
              className="h-10 w-10 shrink-0"
              style={{ 
                borderRadius: '12px',
                backgroundColor: commentText.trim() ? '#1557FF' : undefined
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
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
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(comment.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLocalLikes(liked ? localLikes - 1 : localLikes + 1);
  };

  return (
    <div className={isReply ? "ml-4" : ""}>
      {/* Comment Row with overflow-hidden for clip content */}
      <div className="flex gap-3 overflow-hidden">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs">
            {comment.author.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          {/* Comment Bubble */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm truncate">{comment.author}</p>
              <span className="text-xs text-gray-400 shrink-0">• {comment.role}</span>
            </div>
            <p className="text-sm text-gray-700 break-words">{comment.content}</p>
          </div>
          
          {/* Action Row */}
          <div className="flex items-center gap-4 mt-2 px-2">
            <button
              onClick={handleLike}
              className="text-xs hover:text-primary transition-colors flex items-center gap-1"
              style={{ color: liked ? '#1557FF' : undefined }}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
              {localLikes > 0 && <span>{localLikes}</span>}
            </button>
            
            {!isReply && (
              <button
                onClick={() => onReply(comment.id, comment.author)}
                className="text-xs text-gray-500 hover:text-primary transition-colors"
              >
                Reply
              </button>
            )}
            
            <span className="text-xs text-gray-400">{comment.timestamp}</span>
            
            <button className="text-xs text-gray-400 hover:text-gray-600 ml-auto">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Nested Replies - Indented by 16px (ml-4) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
