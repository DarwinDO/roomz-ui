/**
 * SwapRoomPage
 * Refactored to use real data and new components
 * Following UX Psychology principles
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SubletCard, SubletFilter } from '@/components/swap';
import { ApplySubletDialog } from '@/components/modals/ApplySubletDialog';
import { SwapRequestDialog } from '@/components/modals/SwapRequestDialog';
import { useSublets } from '@/hooks/useSublets';
import { toast } from 'sonner';
import type { SubletListingWithDetails } from '@/types/swap';

export default function SwapRoomPage() {
  const navigate = useNavigate();

  const [selectedSublet, setSelectedSublet] = useState<SubletListingWithDetails | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    district: '',
    min_price: undefined as number | undefined,
    max_price: undefined as number | undefined,
    start_date: '',
    end_date: '',
  });

  // Fetch sublets with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useSublets(filters);

  const sublets = data?.pages.flatMap((page) => page.sublets) || [];

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

  const handleResetFilters = () => {
    setFilters({
      city: '',
      district: '',
      min_price: undefined,
      max_price: undefined,
      start_date: '',
      end_date: '',
    });
    setSearchQuery('');
  };

  return (
    <div className="pb-20 md:pb-8 min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                SwapRoom
              </h1>
              <p className="text-muted-foreground text-sm hidden sm:block">
                Trao đổi, cho thuê phòng ngắn hạn
              </p>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 rounded-xl hidden md:flex"
            onClick={() => navigate('/my-sublets')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Đăng phòng ngay
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search & Filter Bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo khu vực..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFilters((prev) => ({ ...prev, district: e.target.value }));
              }}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6">
            <SubletFilter
              filters={filters}
              onChange={(f) => setFilters({ ...filters, ...f })}
              onReset={handleResetFilters}
            />
          </div>
        )}

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="browse" className="rounded-lg">
              Tìm phòng
            </TabsTrigger>
            <TabsTrigger value="matches" className="rounded-lg">
              Gợi ý hoán đổi
            </TabsTrigger>
            <TabsTrigger value="mylistings" className="rounded-lg">
              Tin đăng
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold">Tìm chỗ ở ngắn hạn?</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
                    Tìm phòng cho thuê đã xác thực từ sinh viên đi thực tập, du học,
                    hoặc nghỉ hè. Các phòng đều đã được kiểm duyệt.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary">1-3 tháng</Badge>
                    <Badge variant="secondary">Thờ gian linh hoạt</Badge>
                    <Badge variant="secondary">Không cọc dài hạn</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sublets Grid */}
            <div>
              <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                Tin cho thuê đang mở
                {sublets.length > 0 && (
                  <Badge variant="secondary">{sublets.length}</Badge>
                )}
              </h3>

              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-80 animate-pulse" />
                  ))}
                </div>
              ) : isError ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Có lỗi xảy ra khi tải dữ liệu
                  </p>
                  <Button onClick={() => refetch()}>Thử lại</Button>
                </Card>
              ) : sublets.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Chưa có tin đăng nào phù hợp với bộ lọc của bạn
                  </p>
                </Card>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sublets.map((sublet) => (
                      <SubletCard
                        key={sublet.id}
                        sublet={sublet}
                        onApply={handleApply}
                        onSwapRequest={handleSwapRequest}
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {hasNextPage && (
                    <div className="mt-6 text-center">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2 font-medium text-lg">Gợi ý hoán đổi phòng</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Chúng tôi sẽ tìm những phòng phù hợp để bạn có thể hoán đổi dựa trên
                vị trí, giá cả và thờ gian.
              </p>
              <Button onClick={() => navigate('/swap-matches')}>
                Xem gợi ý của tôi
              </Button>
            </Card>
          </TabsContent>

          {/* My Listings Tab */}
          <TabsContent value="mylistings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tin đăng của bạn</h3>
              <Button
                className="bg-primary hover:bg-primary/90 rounded-xl md:hidden"
                onClick={() => navigate('/my-sublets')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Đăng
              </Button>
            </div>

            <Card className="p-12 rounded-2xl text-center border-dashed border-2 border-muted">
              <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-medium">Quản lý tin đăng</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Xem và quản lý tất cả tin đăng cho thuê phòng của bạn ở đây.
              </p>
              <Button
                className="bg-primary hover:bg-primary/90 rounded-xl"
                onClick={() => navigate('/my-sublets')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Quản lý tin đăng
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        {/* How it Works */}
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="mb-8 text-center text-lg font-semibold">
            Cách SwapRoom hoạt động
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Đăng phòng', desc: 'kèm thờ gian và giá mong muốn' },
              { step: 2, title: 'Nhận gợi ý', desc: 'từ những ngườ thuê đã xác thực' },
              { step: 3, title: 'Thanh toán an toàn', desc: 'trên nền tảng RoomZ' },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <p className="text-sm px-4">
                  <strong className="block mb-1 text-base">{item.title}</strong>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ApplySubletDialog
        sublet={selectedSublet}
        isOpen={isApplyDialogOpen}
        onClose={() => setIsApplyDialogOpen(false)}
      />
      <SwapRequestDialog
        targetSublet={selectedSublet}
        isOpen={isSwapDialogOpen}
        onClose={() => setIsSwapDialogOpen(false)}
      />

      {/* Floating Action Button - Mobile */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Button
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          size="icon"
          onClick={() => navigate('/my-sublets')}
          aria-label="Đăng phòng mới"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
