/**
 * SubletCard Component
 * Display card for sublet listings
 * Following Supabase Postgres Best Practices
 */

import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MapPin, Calendar, User, Star, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LazyImage } from '@/components/common/LazyImage';
import { formatMonthlyPrice } from '@/utils/format';
import type { SubletListingWithDetails } from '@/types/swap';

interface SubletCardProps {
    sublet: SubletListingWithDetails;
    showMatchScore?: boolean;
    onApply?: (sublet: SubletListingWithDetails) => void;
    onSwapRequest?: (sublet: SubletListingWithDetails) => void;
}

export function SubletCard({
    sublet,
    showMatchScore = false,
    onApply,
    onSwapRequest,
}: SubletCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/sublet/${sublet.id}`);
    };

    const startDate = new Date(sublet.start_date);
    const endDate = new Date(sublet.end_date);
    const durationMonths = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    const discount = sublet.original_price > 0
        ? Math.round(((sublet.original_price - sublet.sublet_price) / sublet.original_price) * 100)
        : 0;

    return (
        <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden" onClick={handleClick}>
                <LazyImage
                    src={sublet.images?.[0]?.image_url || '/placeholder-room.jpg'}
                    alt={sublet.room_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Match Score Badge */}
                {showMatchScore && sublet.matchPercentage && (
                    <Badge className="absolute top-3 left-3 bg-green-500/90 text-white border-0">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Match {sublet.matchPercentage}%
                    </Badge>
                )}

                {/* Discount Badge */}
                {discount > 0 && (
                    <Badge className="absolute top-3 right-3 bg-red-500/90 text-white border-0">
                        -{discount}%
                    </Badge>
                )}

                {/* Verified Badge */}
                {sublet.owner_verified && (
                    <Badge className="absolute bottom-3 right-3 bg-blue-500/90 text-white border-0">
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        Đã xác thực
                    </Badge>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title & Price */}
                <div className="flex justify-between items-start gap-2">
                    <h3
                        className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors"
                        onClick={handleClick}
                    >
                        {sublet.room_title}
                    </h3>
                    <div className="text-right shrink-0">
                        <div className="font-bold text-primary text-lg">
                            {formatMonthlyPrice(sublet.sublet_price)}
                        </div>
                        {sublet.original_price > sublet.sublet_price && (
                            <div className="text-sm text-muted-foreground line-through">
                                {formatMonthlyPrice(sublet.original_price)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-1">
                        {sublet.district}, {sublet.city}
                    </span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                        {format(startDate, 'dd/MM/yyyy', { locale: vi })} -{' '}
                        {format(endDate, 'dd/MM/yyyy', { locale: vi })} ({durationMonths} tháng)
                    </span>
                </div>

                {/* Owner */}
                <div className="flex items-center gap-2 pt-2 border-t">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {sublet.owner_avatar ? (
                            <img
                                src={sublet.owner_avatar}
                                alt={sublet.owner_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                        )}
                    </div>
                    <span className="text-sm font-medium">{sublet.owner_name}</span>
                    {sublet.owner_verified && (
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    {onApply && (
                        <Button
                            className="flex-1"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onApply(sublet);
                            }}
                        >
                            Đăng ký thuê
                        </Button>
                    )}
                    {onSwapRequest && (
                        <Button
                            className="flex-1"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSwapRequest(sublet);
                            }}
                        >
                            Đề nghị hoán đổi
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
