/**
 * RoommateCard - Individual roommate card in results list
 * Shows compatibility score, basic info, and action buttons
 * 
 * Layout: Split Button (3 actions: Nhắn, Xem, Kết nối)
 * - Mobile-friendly with proper touch targets
 * - Responsive text/icon only on smaller screens
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Heart,
    MessageCircle,
    MapPin,
    GraduationCap,
    Send,
    Check,
    Eye,
    Moon,
    Sparkles,
    Volume2,
    Users,
    Coffee,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoommateMatch } from '@/services/roommates';

interface RoommateCardProps {
    match: RoommateMatch;
    onViewProfile: () => void;
    onSendRequest: () => void;
    onMessage: () => void;
    hasPendingRequest: boolean;
    canSendRequest: boolean;
    isConnected?: boolean;
    hasIntroMessage?: boolean;
}

// Score color based on value
function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
}

function getScoreLabel(score: number): string {
    if (score >= 90) return 'Rất phù hợp';
    if (score >= 75) return 'Phù hợp cao';
    if (score >= 60) return 'Phù hợp';
    return 'Tương đối';
}

// Score breakdown component (compact)
function ScoreBreakdown({
    sleepScore,
    cleanlinessScore,
    noiseScore,
    guestScore,
    weekendScore,
}: {
    sleepScore: number;
    cleanlinessScore: number;
    noiseScore: number;
    guestScore: number;
    weekendScore: number;
}) {
    const scores = [
        { label: 'Lịch ngủ', value: sleepScore, icon: Moon },
        { label: 'Ngăn nắp', value: cleanlinessScore, icon: Sparkles },
        { label: 'Tiếng ồn', value: noiseScore, icon: Volume2 },
        { label: 'Khách', value: guestScore, icon: Users },
        { label: 'Cuối tuần', value: weekendScore, icon: Coffee },
    ];

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {scores.map((score) => {
                const Icon = score.icon;
                const colorClass = score.value >= 80
                    ? 'text-green-600'
                    : score.value >= 50
                        ? 'text-yellow-600'
                        : 'text-red-500';

                return (
                    <div
                        key={score.label}
                        className="flex items-center gap-1 text-xs"
                        title={`${score.label}: ${score.value}%`}
                    >
                        <Icon className={cn('w-3 h-3', colorClass)} />
                        <span className={colorClass}>{score.value}%</span>
                    </div>
                );
            })}
        </div>
    );
}

export function RoommateCard({
    match,
    onViewProfile,
    onSendRequest,
    onMessage,
    hasPendingRequest,
    canSendRequest,
    isConnected = false,
    hasIntroMessage = false,
}: RoommateCardProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            {/* Main Content Row */}
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                        <AvatarImage src={match.avatar_url || undefined} alt={match.full_name} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                            {getInitials(match.full_name)}
                        </AvatarFallback>
                    </Avatar>

                    {/* Compatibility Score Badge */}
                    <div
                        className={cn(
                            'absolute -bottom-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 border-white',
                            getScoreColor(match.compatibility_score)
                        )}
                    >
                        {match.compatibility_score}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <h3 className="font-semibold text-base sm:text-lg truncate">{match.full_name}</h3>
                            {match.age && (
                                <p className="text-xs sm:text-sm text-muted-foreground">{match.age} tuổi</p>
                            )}
                        </div>
                        <Badge variant="outline" className={cn('ml-2 hidden sm:flex', getScoreColor(match.compatibility_score))}>
                            <Heart className="w-3 h-3 mr-1" />
                            {getScoreLabel(match.compatibility_score)}
                        </Badge>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                            {match.district ? `${match.district}, ` : ''}
                            {match.city}
                        </span>
                    </div>

                    {/* University - Hidden on very small screens */}
                    {match.university && (
                        <div className="hidden sm:flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-1">
                            <GraduationCap className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{match.university}</span>
                        </div>
                    )}

                    {/* Bio - Hidden on mobile */}
                    {match.bio && (
                        <p className="hidden md:block text-sm text-muted-foreground line-clamp-2 mb-1">
                            {match.bio}
                        </p>
                    )}

                    {/* Hobbies - Compact on mobile */}
                    {match.hobbies && match.hobbies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                            {match.hobbies.slice(0, 3).map((hobby) => (
                                <Badge key={hobby} variant="secondary" className="text-xs py-0">
                                    {hobby}
                                </Badge>
                            ))}
                            {match.hobbies.length > 3 && (
                                <Badge variant="secondary" className="text-xs py-0">
                                    +{match.hobbies.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Score Breakdown - Hidden on mobile */}
                    <div className="hidden sm:block">
                        <ScoreBreakdown
                            sleepScore={match.sleep_score}
                            cleanlinessScore={match.cleanliness_score}
                            noiseScore={match.noise_score}
                            guestScore={match.guest_score}
                            weekendScore={match.weekend_score}
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons Row - Simplified 2-button Layout */}
            <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 border-t">
                {/* View Profile Button - Always visible */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewProfile}
                    className="h-9 sm:h-8 gap-1 sm:gap-2"
                    title="Xem hồ sơ chi tiết"
                >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Xem</span>
                </Button>

                {/* Primary Action Button - Changes based on connection state */}
                {isConnected ? (
                    // Connected: Show chat button
                    <Button
                        size="sm"
                        onClick={onMessage}
                        className="flex-1 h-9 sm:h-8 gap-1 sm:gap-2 bg-emerald-600 hover:bg-emerald-700"
                        title="Mở cuộc trò chuyện"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">Nhắn tin</span>
                    </Button>
                ) : hasPendingRequest || hasIntroMessage ? (
                    // Pending: Show disabled "Đã gửi" button
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        className="flex-1 h-9 sm:h-8 gap-1 sm:gap-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        title="Yêu cầu kết nối đang chờ phản hồi"
                    >
                        <Check className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">Đã gửi yêu cầu</span>
                    </Button>
                ) : (
                    // Not sent: Show send request button
                    <Button
                        size="sm"
                        onClick={onSendRequest}
                        disabled={!canSendRequest}
                        className="flex-1 h-9 sm:h-8 gap-1 sm:gap-2"
                        title="Gửi lời chào và yêu cầu kết nối"
                    >
                        <Send className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">Gửi lời chào</span>
                    </Button>
                )}
            </div>
        </Card>
    );
}
