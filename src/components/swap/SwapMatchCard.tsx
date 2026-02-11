/**
 * SwapMatchCard Component
 * Display card for swap match suggestions
 * Following UX Psychology principles from frontend-design skill
 */

import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MapPin, Calendar, ArrowRightLeft, Check, X, Star, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LazyImage } from '@/components/common/LazyImage';
import { formatMonthlyPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { SwapMatch } from '@/types/swap';

interface SwapMatchCardProps {
    match: SwapMatch;
    onAccept: () => void;
    onPass: () => void;
}

export function SwapMatchCard({ match, onAccept, onPass }: SwapMatchCardProps) {
    const navigate = useNavigate();

    const myListing = match.my_listing;
    const matchedListing = match.matched_listing;

    if (!myListing || !matchedListing) return null;

    const matchScore = match.match_score;
    const matchReasons = match.match_reasons || [];

    // Determine match quality color
    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-500 bg-green-50';
        if (score >= 70) return 'text-blue-500 bg-blue-50';
        return 'text-orange-500 bg-orange-50';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 85) return 'Rất phù hợp';
        if (score >= 70) return 'Phù hợp';
        return 'Có thể phù hợp';
    };

    return (
        <Card
            className={cn(
                'overflow-hidden transition-all duration-300',
                'hover:shadow-xl hover:-translate-y-1',
                'border-2 border-transparent hover:border-primary/20'
            )}
        >
            {/* Match Score Header */}
            <div className={cn('px-4 py-3 flex items-center justify-between', getScoreColor(matchScore))}>
                <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-bold text-lg">{matchScore}%</span>
                    <span className="text-sm font-medium">{getScoreLabel(matchScore)}</span>
                </div>
                <Badge variant="secondary" className="bg-white/80">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {matchReasons.length} điểm phù hợp
                </Badge>
            </div>

            {/* Comparison Section */}
            <div className="p-4 space-y-4">
                {/* Match Reasons */}
                {matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {matchReasons.slice(0, 3).map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                                {reason}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* My Listing */}
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                        Phòng của bạn
                    </p>
                    <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                            <LazyImage
                                src={myListing.images?.[0]?.image_url || '/placeholder-room.jpg'}
                                alt="My room"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-1">{myListing.room?.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {myListing.room?.district}, {myListing.room?.city}
                            </p>
                            <p className="text-primary font-semibold mt-1">
                                {formatMonthlyPrice(myListing.sublet_price)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Swap Icon */}
                <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowRightLeft className="w-5 h-5 text-primary" />
                    </div>
                </div>

                {/* Matched Listing */}
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                        Phòng đề xuất
                    </p>
                    <div
                        className="flex gap-3 p-3 bg-primary/5 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => navigate(`/sublet/${matchedListing.id}`)}
                    >
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                            <LazyImage
                                src={matchedListing.images?.[0]?.image_url || '/placeholder-room.jpg'}
                                alt="Matched room"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-1">{matchedListing.room?.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {matchedListing.room?.district}, {matchedListing.room?.city}
                            </p>
                            <p className="text-primary font-semibold mt-1">
                                {formatMonthlyPrice(matchedListing.sublet_price)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Comparison */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Thờ gian của bạn</p>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>
                                {format(new Date(myListing.start_date), 'dd/MM', { locale: vi })} -{' '}
                                {format(new Date(myListing.end_date), 'dd/MM', { locale: vi })}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Thờ gian đề xuất</p>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>
                                {format(new Date(matchedListing.start_date), 'dd/MM', { locale: vi })} -{' '}
                                {format(new Date(matchedListing.end_date), 'dd/MM', { locale: vi })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onPass}
                >
                    <X className="w-4 h-4 mr-2" />
                    Bỏ qua
                </Button>
                <Button
                    className="flex-1"
                    onClick={onAccept}
                >
                    <Check className="w-4 h-4 mr-2" />
                    Gửi yêu cầu
                </Button>
            </div>
        </Card>
    );
}
