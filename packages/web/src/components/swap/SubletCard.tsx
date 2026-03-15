import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BadgeCheck, CalendarRange, MapPin, Star, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LazyImage } from '@/components/common/LazyImage';
import { formatMonthlyPrice } from '@roomz/shared/utils/format';
import type { SubletListingWithDetails } from '@roomz/shared/types/swap';

interface SubletCardProps {
  sublet: SubletListingWithDetails;
  showMatchScore?: boolean;
  onApply?: (sublet: SubletListingWithDetails) => void;
  onSwapRequest?: (sublet: SubletListingWithDetails) => void;
}

export function SubletCard({ sublet, showMatchScore = false, onApply, onSwapRequest }: SubletCardProps) {
  const startDate = new Date(sublet.start_date);
  const endDate = new Date(sublet.end_date);
  const durationMonths = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const discount = sublet.original_price > 0
    ? Math.round(((sublet.original_price - sublet.sublet_price) / sublet.original_price) * 100)
    : 0;

  return (
    <Card className="group overflow-hidden border border-slate-200 bg-white transition-colors hover:border-slate-300">
      <Link to={`/sublet/${sublet.id}`} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden">
          <LazyImage
            src={sublet.images?.[0]?.image_url || '/placeholder-room.jpg'}
            alt={sublet.room_title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge className="border-0 bg-white/92 text-slate-900">Ở ngắn hạn</Badge>
            {showMatchScore && sublet.matchPercentage ? (
              <Badge className="border-0 bg-emerald-500/92 text-white">
                <Star className="mr-1 h-3 w-3 fill-current" />
                {sublet.matchPercentage}% phù hợp
              </Badge>
            ) : null}
          </div>

          <div className="absolute bottom-3 right-3 rounded-2xl bg-white/94 px-3 py-2 text-right text-slate-950 shadow-sm">
            <p className="text-sm font-semibold text-primary">{formatMonthlyPrice(sublet.sublet_price)}</p>
            {sublet.original_price > sublet.sublet_price ? (
              <p className="text-xs text-muted-foreground line-through">{formatMonthlyPrice(sublet.original_price)}</p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <p className="line-clamp-2 text-lg font-semibold text-slate-950">{sublet.room_title}</p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" />
            {sublet.district}, {sublet.city}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="rounded-full px-2.5 py-1">
            <CalendarRange className="mr-1 h-3 w-3" />
            {durationMonths} tháng
          </Badge>
          <Badge variant="secondary" className="rounded-full px-2.5 py-1">
            {format(startDate, 'dd/MM', { locale: vi })} - {format(endDate, 'dd/MM', { locale: vi })}
          </Badge>
          {discount > 0 ? <Badge variant="secondary" className="rounded-full px-2.5 py-1">Tiết kiệm {discount}%</Badge> : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted">
            {sublet.owner_avatar ? (
              <img src={sublet.owner_avatar} alt={sublet.owner_name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{sublet.owner_name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Host</span>
              {sublet.owner_verified ? (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-sky-700">
                    <BadgeCheck className="h-3 w-3" />
                    Đã xác thực
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button asChild className="flex-1" variant="outline" size="sm">
            <Link to={`/sublet/${sublet.id}`}>Xem chi tiết</Link>
          </Button>
          {onApply ? (
            <Button
              className="flex-1"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onApply(sublet);
              }}
            >
              Đăng ký ở
            </Button>
          ) : null}
          {onSwapRequest ? (
            <Button
              className="flex-1"
              variant="secondary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onSwapRequest(sublet);
              }}
            >
              Hoán đổi
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
