/**
 * RoommateCard - Individual roommate card in results list
 * Shows compatibility score, basic info, and action buttons
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

// Score breakdown component
function ScoreBreakdown({
    sleepScore,
    cleanlinessScore,
    noiseScore,
    guestScore,
    weekendScore,
    budgetScore,
}: {
    sleepScore: number;
    cleanlinessScore: number;
    noiseScore: number;
    guestScore: number;
    weekendScore: number;
    budgetScore: number;
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
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <Avatar className="w-20 h-20">
                        <AvatarImage src={match.avatar_url || undefined} alt={match.full_name} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                            {getInitials(match.full_name)}
                        </AvatarFallback>
                    </Avatar>

                    {/* Compatibility Score Badge */}
                    <div
                        className={cn(
                            'absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white',
                            getScoreColor(match.compatibility_score)
                        )}
                    >
                        {match.compatibility_score}
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="font-semibold text-lg truncate">{match.full_name}</h3>
                            {match.age && (
                                <p className="text-sm text-muted-foreground">{match.age} tuổi</p>
                            )}
                        </div>
                        <Badge variant="outline" className={cn('ml-2', getScoreColor(match.compatibility_score))}>
                            <Heart className="w-3 h-3 mr-1" />
                            {getScoreLabel(match.compatibility_score)}
                        </Badge>
                    </div>

                    {/* Location & University */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>
                                {match.district ? `${match.district}, ` : ''}
                                {match.city}
                            </span>
                        </div>
                        {match.university && (
                            <div className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                <span className="truncate max-w-[200px]">{match.university}</span>
                            </div>
                        )}
                    </div>

                    {/* Bio */}
                    {match.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {match.bio}
                        </p>
                    )}

                    {/* Hobbies */}
                    {match.hobbies && match.hobbies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {match.hobbies.slice(0, 4).map((hobby) => (
                                <Badge key={hobby} variant="secondary" className="text-xs">
                                    {hobby}
                                </Badge>
                            ))}
                            {match.hobbies.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{match.hobbies.length - 4}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Score Breakdown */}
                    <ScoreBreakdown
                        sleepScore={match.sleep_score}
                        cleanlinessScore={match.cleanliness_score}
                        noiseScore={match.noise_score}
                        guestScore={match.guest_score}
                        weekendScore={match.weekend_score}
                        budgetScore={match.budget_score}
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewProfile}
                        className="w-24"
                    >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                    </Button>

                    {hasPendingRequest ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            className="w-24"
                        >
                            <Check className="w-4 h-4 mr-1" />
                            Đã gửi
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={onSendRequest}
                            disabled={!canSendRequest}
                            className="w-24"
                        >
                            <Send className="w-4 h-4 mr-1" />
                            Kết nối
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
