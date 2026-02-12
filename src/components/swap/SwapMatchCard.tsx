/**
 * SwapMatchCard Component
 * Display card for swap match suggestions (RPC-based)
 * Simplified version - no pass button, direct request
 */

import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ArrowRightLeft, Send, Star, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LazyImage } from '@/components/common/LazyImage';
import { formatMonthlyPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { PotentialMatch } from '@/types/swap';

interface SwapMatchCardProps {
    match: PotentialMatch;
    onRequestSwap: () => void;
}

export function SwapMatchCard({ match, onRequestSwap }: SwapMatchCardProps) {
    const navigate = useNavigate();

    const matchedListing = match.matched_listing;
    const matchScore = match.match_score;

    if (!matchedListing) return null;

    // Determine match quality color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500 bg-green-50';
        if (score >= 60) return 'text-blue-500 bg-blue-50';
        return 'text-orange-500 bg-orange-50';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Rất phù hợp';
        if (score >= 60) return 'Phù hợp';
        return 'Có thể phù hợp';
    };

    // Get primary image
    const primaryImage = matchedListing.images?.find(img => img.is_primary)?.image_url
        || matchedListing.images?.[0]?.image_url
        || '/placeholder-room.jpg';

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
                    Hoán đổi
                </Badge>
            </div>

            {/* Matched Listing */}
            <div className="p-4 space-y-4">
                {/* Image */}
                <div
                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/sublet/${matchedListing.id}`)}
                >
                    <LazyImage
                        src={primaryImage}
                        alt={matchedListing.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-semibold line-clamp-1">{matchedListing.title}</p>
                        <p className="text-white/80 text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {matchedListing.district}, {matchedListing.city}
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Giá thuê</p>
                        <p className="text-primary font-semibold">
                            {formatMonthlyPrice(matchedListing.sublet_price)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Diện tích</p>
                        <p>{matchedListing.area_sqm}m²</p>
                    </div>
                    {matchedListing.bedroom_count !== null && (
                        <div className="space-y-1">
                            <p className="text-muted-foreground text-xs">Phòng ngủ</p>
                            <p>{matchedListing.bedroom_count} PN</p>
                        </div>
                    )}
                    {matchedListing.bathroom_count !== null && (
                        <div className="space-y-1">
                            <p className="text-muted-foreground text-xs">Phòng tắm</p>
                            <p>{matchedListing.bathroom_count} PT</p>
                        </div>
                    )}
                </div>

                {/* Owner */}
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                            {matchedListing.owner_name?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{matchedListing.owner_name}</p>
                    </div>
                </div>
            </div>

            {/* Action */}
            <div className="p-4 pt-0">
                <Button
                    className="w-full"
                    onClick={onRequestSwap}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Gửi yêu cầu hoán đổi
                </Button>
            </div>
        </Card>
    );
}
