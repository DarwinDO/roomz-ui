/**
 * SwapMatchesPage
 * Display secondary swap opportunities for users who already have a short-stay listing.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SwapMatchCard } from '@/components/swap';
import { SwapRequestDialog } from '@/components/modals/SwapRequestDialog';
import { useSwapMatches } from '@/hooks/useSwap';
import type { PotentialMatch } from '@roomz/shared/types/swap';

interface SwapDialogTarget {
  id: string;
  start_date: string;
  end_date: string;
  sublet_price: number;
  room: {
    title: string;
    address: string;
    district: string;
    city: string;
  };
  owner: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  images: Array<{ image_url: string }>;
}

function adaptMatchToDialogTarget(match: PotentialMatch): SwapDialogTarget {
  const listing = match.matched_listing;
  const fallbackDate = new Date().toISOString().split('T')[0];

  return {
    id: match.matched_listing_id,
    start_date: listing.start_date || fallbackDate,
    end_date: listing.end_date || fallbackDate,
    sublet_price: listing.sublet_price,
    room: {
      title: listing.title,
      address: listing.address,
      district: listing.district,
      city: listing.city,
    },
    owner: {
      id: '',
      full_name: listing.owner_name,
      avatar_url: listing.owner_avatar,
    },
    images: listing.images.map((image) => ({ image_url: image.image_url })),
  };
}

export default function SwapMatchesPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useSwapMatches(40);

  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  const matches = data?.matches || [];

  const openSwapRequest = (match: PotentialMatch) => {
    setSelectedMatch(match);
    setIsRequestDialogOpen(true);
  };

  return (
    <div lang="vi" className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/swap')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.currentTarget.blur();
                }
              }}
              aria-label="Quay lại mục ở ngắn hạn"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Cơ hội hoán đổi</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Xem thêm các cơ hội phụ trợ khi bạn đã có chỗ ở ngắn hạn phù hợp.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>{matches.length} cơ hội</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Card className="mb-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold text-slate-950">Gợi ý phụ trợ, không phải cam kết tự động</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Hệ thống chỉ dùng các tín hiệu gần nhau về khu vực, mức giá và thời gian ở để gợi ý nơi nên nói chuyện thêm.
                Hãy xem đây là một cơ hội bổ sung bên cạnh việc tìm chỗ ở ngắn hạn phù hợp.
              </p>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="h-96 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8 text-center">
            <p className="mb-4 text-muted-foreground">Không thể tải danh sách cơ hội hoán đổi lúc này.</p>
            <Button onClick={() => refetch()}>Tải lại</Button>
          </Card>
        ) : matches.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Chưa có cơ hội phù hợp</h3>
            <p className="mx-auto mb-6 max-w-md text-muted-foreground">
              Hãy đăng một chỗ ở ngắn hạn đang hoạt động trước. Khi có đủ tín hiệu về khu vực, giá và thời gian ở,
              hệ thống sẽ gợi ý các cơ hội nên trao đổi thêm.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" onClick={() => navigate('/swap')}>
                Xem chỗ ở ngắn hạn
              </Button>
              <Button onClick={() => navigate('/my-sublets')}>Quản lý chỗ ở của tôi</Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <SwapMatchCard
                key={`${match.listing_id}-${match.matched_listing_id}`}
                match={match}
                onRequestSwap={() => openSwapRequest(match)}
              />
            ))}
          </div>
        )}
      </div>

      <SwapRequestDialog
        targetSublet={selectedMatch ? adaptMatchToDialogTarget(selectedMatch) : null}
        isOpen={isRequestDialogOpen}
        onClose={() => {
          setIsRequestDialogOpen(false);
          setSelectedMatch(null);
        }}
      />
    </div>
  );
}
