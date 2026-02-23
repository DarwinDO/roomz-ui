import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Heart, MessageCircle, Share2, ShieldCheck, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Post } from "../types";

interface PostCardProps {
    post: Post;
    currentUserId?: string;
    onLike: (postId: string) => void;
    onClick: () => void;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: string) => void;
    getTimeAgo: (timestamp: string) => string;
    getTypeColor: (type: string) => string;
    getTypeLabel: (type: string) => string;
}

export function PostCard({ post, currentUserId, onLike, onClick, onEdit, onDelete, getTimeAgo, getTypeColor, getTypeLabel }: PostCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isOwner = currentUserId && post.user_id === currentUserId;

    return (
        <Card
            className="p-5 rounded-2xl transition-all duration-300 cursor-pointer shadow-soft hover:shadow-soft-lg hover-lift border border-border"
            style={{
                borderColor: isHovered ? 'var(--primary)' : undefined,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Clickable Card Body */}
            <div onClick={onClick}>
                {/* Author Info */}
                <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                            {post.author.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm truncate font-medium">{post.author.name}</p>
                            {post.author.verified && (
                                <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">{post.author.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(post.type)} variant="secondary">
                            {getTypeLabel(post.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{getTimeAgo(post.timestamp)}</span>

                        {/* Owner actions menu */}
                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                                        aria-label="Tùy chọn bài viết"
                                    >
                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit?.(post);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Chỉnh sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Bạn có chắc muốn xóa bài viết này?")) {
                                                onDelete?.(post.id);
                                            }
                                        }}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Xóa bài viết
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Post Content */}
                <div>
                    <h3 className="mb-2 text-lg font-semibold">{post.title}</h3>
                    {post.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.content}</p>
                    )}

                    {/* Images */}
                    {post.images.length > 0 && (
                        <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? "grid-cols-1" :
                            post.images.length === 2 ? "grid-cols-2" :
                                "grid-cols-3"
                            }`}>
                            {post.images.slice(0, 3).map((image, index) => (
                                <div key={index} className="relative aspect-video overflow-hidden rounded-xl">
                                    <ImageWithFallback
                                        src={image}
                                        alt={`Ảnh bài viết ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Interaction Bar */}
            <div
                className="flex items-center gap-4 pt-3 border-t border-border"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onLike(post.id);
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors cursor-pointer group"
                >
                    <Heart className={`w-5 h-5 transition-all ${post.liked ? "fill-destructive text-destructive scale-110" : "group-hover:scale-110"}`} />
                    <span className={post.liked ? "text-destructive" : ""}>{post.likes}</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
                >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{post.comments}</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
                >
                    <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{post.shares}</span>
                </button>
            </div>
        </Card>
    );
}
