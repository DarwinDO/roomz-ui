import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarRange, Filter, Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SubletCard, SubletFilter } from '@/components/swap';
import { ApplySubletDialog } from '@/components/modals/ApplySubletDialog';
import { SwapRequestDialog } from '@/components/modals/SwapRequestDialog';
import { useMySublets, useSublets } from '@/hooks/useSublets';
import type { SubletFilters, SubletListingWithDetails } from '@roomz/shared/types/swap';

const INITIAL_FILTERS: SubletFilters = {
  city: '',
  district: '',
  min_price: undefined,
  max_price: undefined,
  start_date: '',
  end_date: '',
  room_type: undefined,
  furnished: undefined,
};

export default function SwapRoomPage() {
  const navigate = useNavigate();
  const [selectedSublet, setSelectedSublet] = useState<SubletListingWithDetails | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SubletFilters>(INITIAL_FILTERS);

  const { data: mySublets, isLoading: isMySubletsLoading } = useMySublets();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useSublets(filters);

  const sublets = useMemo(() => data?.pages.flatMap((page) => page.sublets) || [], [data]);

  const filteredSublets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sublets;

    return sublets.filter((sublet) => {
      const haystack = [sublet.room?.title, sublet.room?.district, sublet.room?.city, sublet.room?.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchQuery, sublets]);

  const handleApply = (sublet: SubletListingWithDetails) => {
    setSelectedSublet(sublet);
    setIsApplyDialogOpen(true);
  };

  const handleSwapRequest = (sublet: SubletListingWithDetails) => {
    setSelectedSublet(sublet);
    setIsSwapDialogOpen(true);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
  }, []);

  const handleFilterChange = useCallback((nextFilters: SubletFilters) => {
    setFilters((previous) => ({ ...previous, ...nextFilters }));
  }, []);

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'pageSize') return false;
    return value !== undefined && value !== '';
  }).length;

  return (
    <div
      lang="vi"
      className="min-h-screen bg-[var(--hero-bg)] pb-20 md:pb-8"
    >
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl text-slate-950">Ở ngắn hạn</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">Chọn chỗ ở theo khu vực, thời gian và giá phù hợp.</p>
            </div>
          </div>
          <Button className="hidden rounded-xl md:flex" onClick={() => navigate('/create-sublet')}>
            <Plus className="mr-2 h-4 w-4" />
            Đăng chỗ ở ngắn hạn
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Card className="mb-6 overflow-hidden rounded-[32px] border-border/70 bg-[var(--hero-card-swap)] p-6 shadow-soft-lg">
          <div className="grid gap-5 lg:grid-cols-[0.98fr_1.02fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary shadow-sm">
                Ở ngắn hạn
              </div>
              <h2 className="mt-5 max-w-[14ch] text-foreground">
                Chốt nhu cầu ở tạm theo thời gian trước, rồi mới so giá và khu vực.
              </h2>
              <p className="mt-4 max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-base">
                Luồng này dành cho sublet, ở chuyển tiếp và đổi chỗ ở ngắn hạn. Bạn có thể duyệt tin đang mở,
                xem cơ hội hoán đổi hoặc quản lý listing của chính mình trong cùng một hub.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  Theo thời gian ở
                </span>
                <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
                  Sublet và hoán đổi
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-warning">
                  Quản lý listing ngay trong hub
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
              <Card className="rounded-[28px] border-border/70 bg-[#102131] p-5 text-white shadow-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">Nhịp ngắn hạn</p>
                    <p className="mt-3 max-w-[24ch] text-2xl font-semibold leading-tight text-white">
                      Search ngắn hạn bắt đầu từ ngày ở, rồi mới siết dần theo giá và nội thất.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 text-sky-100">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Tin đang mở</p>
                    <p className="mt-2 text-sm font-semibold text-white">{filteredSublets.length} kết quả</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Bộ lọc</p>
                    <p className="mt-2 text-sm font-semibold text-white">{activeFilterCount} đang bật</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Tin của bạn</p>
                    <p className="mt-2 text-sm font-semibold text-white">{mySublets?.length ?? 0} tin đang quản lý</p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4">
                <Card className="rounded-[24px] border-border/70 bg-card/92 p-5 shadow-soft">
                  <Filter className="h-6 w-6 text-primary" />
                  <p className="mt-4 text-sm font-semibold text-foreground">Bám đúng constraint</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Dùng thời gian, giá và mức độ furnished để giữ danh sách gọn hơn ngay từ đầu.
                  </p>
                </Card>
                <Card className="rounded-[24px] border-border/70 bg-card/92 p-5 shadow-soft">
                  <RefreshCw className="h-6 w-6 text-secondary" />
                  <p className="mt-4 text-sm font-semibold text-foreground">Mở sang hoán đổi khi cần</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Khi đã có chỗ ở, bạn có thể chuyển sang nhánh hoán đổi mà không rời khỏi hệ short-stay.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-500">{filteredSublets.length} tin đang mở</p>
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-2xl" onClick={() => navigate('/create-sublet')}>
              Đăng chỗ ở
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate('/my-sublets')}>
              Tin của tôi
            </Button>
          </div>
        </div>

        <Tabs defaultValue="browse" className="mt-6 w-full">
          <TabsList className="mb-4 grid w-full max-w-xl grid-cols-3 rounded-[24px] border border-border/70 bg-card/90 p-1.5 shadow-soft">
            <TabsTrigger value="browse" className="rounded-lg">Tìm chỗ ở</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-lg">Hoán đổi</TabsTrigger>
            <TabsTrigger value="mylistings" className="rounded-lg">Tin của tôi</TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-3 rounded-[24px] border border-border/70 bg-card/90 p-3 shadow-soft lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-3 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              id="swap-search"
              aria-label="Tìm chỗ ở ngắn hạn theo tên, khu vực hoặc địa chỉ"
              placeholder="Tên chỗ ở, khu vực hoặc địa chỉ bạn muốn tìm..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterCount > 0 ? <Badge variant="secondary">{activeFilterCount} bộ lọc</Badge> : null}
            <Button
              variant="outline"
              onClick={() => setShowFilters((value) => !value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && showFilters) {
                  event.preventDefault();
                  setShowFilters(false);
                }
              }}
              className={showFilters ? 'bg-primary/10' : ''}
            >
              <Filter className="mr-2 h-4 w-4" />
              Bộ lọc
            </Button>
          </div>
          </div>

          {showFilters ? (
            <div className="mt-4">
              <SubletFilter filters={filters} onChange={handleFilterChange} onReset={handleResetFilters} />
            </div>
          ) : null}

          <TabsContent value="browse" className="mt-6 space-y-6">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="h-80 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <Card className="rounded-[28px] border border-destructive/20 p-8 text-center shadow-soft">
                <p className="mb-4 text-muted-foreground">Có lỗi khi tải dữ liệu chỗ ở ngắn hạn.</p>
                <Button onClick={() => refetch()}>Thử lại</Button>
              </Card>
            ) : filteredSublets.length === 0 ? (
              <Card className="rounded-[32px] border border-border/70 bg-[var(--hero-empty-state)] p-8 text-center shadow-soft">
                <p className="text-muted-foreground">Chưa có chỗ ở phù hợp với tìm kiếm hoặc bộ lọc hiện tại.</p>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSublets.map((sublet) => (
                    <SubletCard key={sublet.id} sublet={sublet} onApply={handleApply} onSwapRequest={handleSwapRequest} />
                  ))}
                </div>

                {hasNextPage ? (
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={handleLoadMore} disabled={isFetchingNextPage}>
                      {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </TabsContent>

          <TabsContent value="matches" className="mt-6 space-y-6">
              <Card className="rounded-[32px] border border-border/70 bg-[var(--hero-empty-state)] p-8 text-center shadow-soft">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RefreshCw className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Hoán đổi khi bạn đã có chỗ ở</h3>
              <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                Nếu muốn đổi khu vực hoặc thời gian ở, bạn có thể xem các gợi ý phù hợp tại đây.
              </p>
              <Button onClick={() => navigate('/swap-matches')}>
                Xem gợi ý hoán đổi
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="mylistings" className="mt-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Tin của bạn</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quản lý tin đã đăng và các đơn quan tâm đang chờ phản hồi.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/my-sublets')}>
                  Quản lý
                </Button>
                <Button size="sm" onClick={() => navigate('/create-sublet')}>
                  <Plus className="mr-1 h-4 w-4" />
                  Đăng mới
                </Button>
              </div>
            </div>

            {isMySubletsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="p-4">
                    <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-muted" />
                    <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </Card>
                ))}
              </div>
            ) : !mySublets || mySublets.length === 0 ? (
              <Card className="rounded-[32px] border-2 border-dashed border-muted bg-transparent p-12 text-center shadow-soft">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-medium">Bạn chưa đăng tin nào</h3>
                <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
                  Đăng chỗ ở ngắn hạn để bắt đầu nhận đơn quan tâm.
                </p>
                <Button onClick={() => navigate('/create-sublet')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Đăng chỗ ở mới
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(mySublets as unknown as SubletListingWithDetails[]).map((sublet) => (
                  <SubletCard key={sublet.id} sublet={sublet} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <Button
          className="h-14 w-14 rounded-full shadow-lg"
          size="icon"
          onClick={() => navigate('/create-sublet')}
          aria-label="Đăng chỗ ở ngắn hạn"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <ApplySubletDialog sublet={selectedSublet} isOpen={isApplyDialogOpen} onClose={() => setIsApplyDialogOpen(false)} />
      <SwapRequestDialog targetSublet={selectedSublet} isOpen={isSwapDialogOpen} onClose={() => setIsSwapDialogOpen(false)} />
    </div>
  );
}
