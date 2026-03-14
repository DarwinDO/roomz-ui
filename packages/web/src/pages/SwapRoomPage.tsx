import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarRange, Filter, Plus, RefreshCw, Search, Sparkles } from 'lucide-react';
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

  const myListingCount = mySublets?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-primary to-primary/65 bg-clip-text text-xl font-bold text-transparent">
                Ở ngắn hạn
              </h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Tìm chỗ ở linh hoạt trước. Hoán đổi chỉ xuất hiện khi thực sự có tín hiệu phù hợp.
              </p>
            </div>
          </div>
          <Button className="hidden rounded-xl md:flex" onClick={() => navigate('/create-sublet')}>
            <Plus className="mr-2 h-4 w-4" />
            Đăng chỗ ở ngắn hạn
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[30px] border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-amber-50/70 p-6 shadow-soft">
            <Badge className="mb-4 rounded-full bg-white text-slate-700">Short-stay first</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Tìm chỗ ở ngắn hạn rõ ràng trước khi nói đến hoán đổi.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Phù hợp cho thực tập, du học ngắn hạn, nghỉ hè hoặc giai đoạn chuyển chỗ ở. Lane này ưu tiên inventory thuê lại có thời gian cụ thể,
              host rõ ràng và đủ dữ liệu để quyết định nhanh.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="secondary">1-3 tháng</Badge>
              <Badge variant="secondary">Lịch ở linh hoạt</Badge>
              <Badge variant="secondary">Hoán đổi là nhánh phụ trợ</Badge>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="rounded-2xl" onClick={() => navigate('/create-sublet')}>
                Đăng chỗ ở ngắn hạn
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate('/my-sublets')}>
                Quản lý chỗ ở của tôi
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Đang mở</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{filteredSublets.length}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Chỗ ở ngắn hạn phù hợp với search và bộ lọc hiện tại.</p>
            </Card>
            <Card className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Chỗ ở của bạn</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{myListingCount}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Chỗ ở ngắn hạn bạn đang quản lý hoặc chuẩn bị bật lên.</p>
            </Card>
            <Card className="rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white shadow-soft">
              <div className="flex items-center gap-2 text-slate-200">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">Hoán đổi</span>
              </div>
              <p className="mt-3 text-lg font-semibold">Chỉ nên là bước tiếp theo, không phải headline chính.</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Khi vị trí, mức giá và khoảng thời gian ở đủ gần nhau, bạn mới nên mở lane hoán đổi để trao đổi sâu hơn.
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-soft lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-3 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Tên chỗ ở, khu vực hoặc địa chỉ bạn muốn tìm..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterCount > 0 ? <Badge variant="secondary">{activeFilterCount} bộ lọc đang bật</Badge> : null}
            <Button variant="outline" onClick={() => setShowFilters((value) => !value)} className={showFilters ? 'bg-primary/10' : ''}>
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

        <Tabs defaultValue="browse" className="mt-6 w-full">
          <TabsList className="mb-8 grid w-full max-w-xl grid-cols-3 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="browse" className="rounded-lg">Khám phá</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-lg">Cơ hội hoán đổi</TabsTrigger>
            <TabsTrigger value="mylistings" className="rounded-lg">Chỗ ở của tôi</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Chỗ ở ngắn hạn đang mở</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inventory để ở thật trước. Chỉ đi sang hoán đổi khi đã có nơi phù hợp để so sánh.
                </p>
              </div>
              {filteredSublets.length > 0 ? <Badge variant="secondary">{filteredSublets.length} tin</Badge> : null}
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="h-80 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <Card className="p-8 text-center">
                <p className="mb-4 text-muted-foreground">Có lỗi khi tải dữ liệu chỗ ở ngắn hạn.</p>
                <Button onClick={() => refetch()}>Thử lại</Button>
              </Card>
            ) : filteredSublets.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Chưa có chỗ ở ngắn hạn phù hợp với search hoặc bộ lọc hiện tại.</p>
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

          <TabsContent value="matches" className="space-y-6">
            <Card className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RefreshCw className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Hoán đổi là lane phụ trợ</h3>
              <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                Chúng tôi chỉ đẩy mạnh hoán đổi khi vị trí, ngân sách và thời gian ở đủ gần nhau. Nếu bạn đã có chỗ ở ngắn hạn hợp lý,
                tab này mới là nơi để mở rộng thêm cơ hội.
              </p>
              <Button onClick={() => navigate('/swap-matches')}>
                Xem gợi ý hoán đổi
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="mylistings" className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Chỗ ở của bạn</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quản lý chỗ ở ngắn hạn, đơn quan tâm và khoảng thời gian còn trống trong cùng một lane.
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
              <Card className="rounded-2xl border-2 border-dashed border-muted bg-transparent p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-medium">Bạn chưa có chỗ ở ngắn hạn nào</h3>
                <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
                  Đăng một chỗ ở ngắn hạn để nhận đơn quan tâm hoặc mở thêm cơ hội hoán đổi khi các tín hiệu phù hợp đủ rõ.
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
