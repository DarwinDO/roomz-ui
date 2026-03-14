/**
 * SwapMatchCard Component
 * Display secondary swap opportunities.
 */

import { useNavigate } from 'react-router-dom';
import { MapPin, Send, Star, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LazyImage } from '@/components/common/LazyImage';
import { formatMonthlyPrice } from '@roomz/shared/utils/format';
import { cn } from '@/lib/utils';
import type { PotentialMatch } from '@roomz/shared/types/swap';

interface SwapMatchCardProps {
  match: PotentialMatch;
  onRequestSwap: () => void;
}

function getScoreColor(score: number) {
  if (score >= 80) {
    return 'text-green-600 bg-green-50';
  }

  if (score >= 60) {
    return 'text-blue-600 bg-blue-50';
  }

  return 'text-orange-600 bg-orange-50';
}

function getScoreLabel(score: number) {
  if (score >= 80) {
    return 'Rất gần';
  }

  if (score >= 60) {
    return 'Khá gần';
  }

  return 'Cần nói chuyện thêm';
}

export function SwapMatchCard({ match, onRequestSwap }: SwapMatchCardProps) {
  const navigate = useNavigate();
  const matchedListing = match.matched_listing;

  if (!matchedListing) {
    return null;
  }

  const primaryImage = matchedListing.images?.find((image) => image.is_primary)?.image_url
    || matchedListing.images?.[0]?.image_url
    || '/placeholder-room.jpg';

  return (
    <Card className={cn('overflow-hidden border-2 border-transparent transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl')}>
      <div className={cn('flex items-center justify-between px-4 py-3', getScoreColor(match.match_score))}>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-current" />
          <span className="text-lg font-bold">{match.match_score}%</span>
          <span className="text-sm font-medium">{getScoreLabel(match.match_score)}</span>
        </div>
        <Badge variant="secondary" className="bg-white/80 text-slate-800">
          <ThumbsUp className="mr-1 h-3 w-3" />
          Cơ hội phụ trợ
        </Badge>
      </div>

      <div className="space-y-4 p-4">
        <div className="relative aspect-video cursor-pointer overflow-hidden rounded-lg" onClick={() => navigate(`/sublet/${matchedListing.id}`)}>
          <LazyImage src={primaryImage} alt={matchedListing.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="line-clamp-1 font-semibold text-white">{matchedListing.title}</p>
            <p className="flex items-center gap-1 text-sm text-white/80">
              <MapPin className="h-3 w-3" />
              {matchedListing.district}, {matchedListing.city}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Giá ở ngắn hạn</p>
            <p className="font-semibold text-primary">{formatMonthlyPrice(matchedListing.sublet_price)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Diện tích</p>
            <p>{matchedListing.area_sqm ?? 'Đang cập nhật'}{matchedListing.area_sqm ? 'm²' : ''}</p>
          </div>
          {matchedListing.bedroom_count !== null ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Phòng ngủ</p>
              <p>{matchedListing.bedroom_count} PN</p>
            </div>
          ) : null}
          {matchedListing.bathroom_count !== null ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Phòng tắm</p>
              <p>{matchedListing.bathroom_count} PT</p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
            {matchedListing.owner_name?.charAt(0) || 'H'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{matchedListing.owner_name}</p>
            <p className="text-xs text-muted-foreground">Host của chỗ ở ngắn hạn</p>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <Button className="w-full" onClick={onRequestSwap}>
          <Send className="mr-2 h-4 w-4" />
          Đề xuất hoán đổi
        </Button>
      </div>
    </Card>
  );
}
