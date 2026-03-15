import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Home,
  Loader2,
  MessageCircle,
  Plus,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useLandlordBookings } from '@/hooks/useBookings';
import { useLandlordRooms } from '@/hooks/useRooms';
import { useConversations } from '@/hooks/useMessages';
import { useAuth } from '@/contexts';
import { toast } from 'sonner';
import type { BookingWithDetails } from '@/services/bookings';
import { HostQualityInbox } from './landlord/components/HostQualityInbox';
import { LandlordStats } from './landlord/components/LandlordStats';
import { LandlordRoomCard } from './landlord/components/LandlordRoomCard';
import { LandlordBookingCard } from './landlord/components/LandlordBookingCard';

const HOST_TAB_VALUES = ['my-rooms', 'pending', 'confirmed', 'history'] as const;
type HostTabValue = (typeof HOST_TAB_VALUES)[number];

export default function LandlordDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    confirmBooking,
    rejectBooking,
    completeBooking,
    refetch: refetchBookings,
  } = useLandlordBookings();
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    stats: roomStats,
    refetch: refetchRooms,
  } = useLandlordRooms(user?.id);
  const { unreadCount: messagesUnreadCount } = useConversations();

  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'reject' | 'complete' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const activeTab = useMemo<HostTabValue>(() => {
    const tab = searchParams.get('tab');
    return HOST_TAB_VALUES.includes(tab as HostTabValue) ? (tab as HostTabValue) : 'my-rooms';
  }, [searchParams]);

  const loading = bookingsLoading || roomsLoading;
  const error = bookingsError || roomsError;

  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');
  const historyBookings = bookings.filter((booking) => booking.status === 'completed' || booking.status === 'cancelled');

  const pendingRooms = rooms.filter((room) => room.status === 'pending');
  const activeRooms = rooms.filter((room) => room.status === 'active');
  const rejectedRooms = rooms.filter((room) => room.status === 'rejected');

  const closeActionDialog = () => {
    setSelectedBooking(null);
    setActionType(null);
    setActionNotes('');
  };

  const openActionDialog = (booking: BookingWithDetails, type: 'confirm' | 'reject' | 'complete') => {
    setSelectedBooking(booking);
    setActionType(type);
    setActionNotes('');
  };

  const handleAction = async () => {
    if (!selectedBooking || !actionType) {
      return;
    }

    setIsProcessing(true);
    try {
      switch (actionType) {
        case 'confirm':
          await confirmBooking(selectedBooking.id, actionNotes);
          toast.success('Đã xác nhận lịch xem phòng');
          break;
        case 'reject':
          await rejectBooking(selectedBooking.id, actionNotes);
          toast.success('Đã từ chối lịch xem phòng');
          break;
        case 'complete':
          await completeBooking(selectedBooking.id, actionNotes);
          toast.success('Đã hoàn thành lịch xem phòng');
          break;
      }
      closeActionDialog();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Không thể thực hiện thao tác. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải dữ liệu host...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-warning" />
          <h2 className="mb-2 text-xl font-semibold">Vui lòng đăng nhập</h2>
          <p className="mb-6 text-muted-foreground">Bạn cần đăng nhập để truy cập Host console.</p>
          <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-xl font-bold text-transparent">Bảng điều khiển host</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">Quản lý tin đăng, lịch xem phòng và chất lượng tin</p>
            </div>
          </div>
          <Button onClick={() => navigate('/post-room')} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Đăng phòng mới</span>
            <span className="sm:hidden">Đăng tin</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <LandlordStats stats={roomStats} />
        <HostQualityInbox pendingRooms={pendingRooms} rejectedRooms={rejectedRooms} />

        {error ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchBookings();
                refetchRooms();
              }}
              className="ml-auto border-destructive/20 hover:bg-destructive/10"
            >
              Thử lại
            </Button>
          </div>
        ) : null}

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setSearchParams((currentParams) => {
              const nextParams = new URLSearchParams(currentParams);
              nextParams.set('tab', value);
              return nextParams;
            });
          }}
          className="space-y-6"
        >
          <TabsList className="grid h-auto w-full grid-cols-4 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="my-rooms" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Tin của tôi</span>
              <span className="sm:hidden">Tin</span>
              <span className="ml-1.5 rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-xs">{rooms.length}</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Chờ xác nhận</span>
              <span className="sm:hidden">Chờ</span>
              <span className="ml-1.5 rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-xs">{pendingBookings.length}</span>
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Sắp tới</span>
              <span className="sm:hidden">Sắp tới</span>
              <span className="ml-1.5 rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-xs">{confirmedBookings.length}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Lịch sử</span>
              <span className="sm:hidden">Lịch sử</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-rooms" className="space-y-6 animate-fade-in">
            {rooms.length === 0 ? (
              <Card className="border-2 border-dashed bg-transparent shadow-none">
                <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Home className="h-8 w-8 text-muted-foreground/50" />
                </div>
                  <h3 className="mb-2 text-lg font-medium">Bạn chưa có tin nào</h3>
                  <p className="mx-auto mb-6 max-w-sm text-muted-foreground">Đăng tin đầu tiên để bắt đầu nhận lịch xem phòng và quản lý mọi việc ở đây.</p>
                  <Button onClick={() => navigate('/post-room')} size="lg" className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Đăng phòng đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {pendingRooms.length > 0 ? (
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-warning">
                      <Clock className="h-4 w-4" />
                      Đang chờ duyệt ({pendingRooms.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {pendingRooms.map((room) => (
                        <LandlordRoomCard key={room.id} room={room} status="pending" />
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeRooms.length > 0 ? (
                  <div className={pendingRooms.length > 0 ? 'border-t border-border pt-4' : ''}>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-success">
                      <CheckCircle className="h-4 w-4" />
                      Đang hoạt động ({activeRooms.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {activeRooms.map((room) => (
                        <LandlordRoomCard key={room.id} room={room} status="active" />
                      ))}
                    </div>
                  </div>
                ) : null}

                {rejectedRooms.length > 0 ? (
                  <div className={pendingRooms.length > 0 || activeRooms.length > 0 ? 'border-t border-border pt-4' : ''}>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-destructive">
                      <XCircle className="h-4 w-4" />
                      Cần chỉnh sửa ({rejectedRooms.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {rejectedRooms.map((room) => (
                        <LandlordRoomCard key={room.id} room={room} status="rejected" />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 animate-fade-in">
            {pendingBookings.length === 0 ? (
              <Card className="border-dashed bg-muted/20 shadow-none">
                <CardContent className="py-12 text-center">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Không có lịch xem phòng nào đang chờ xác nhận</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {pendingBookings.map((booking) => (
                  <LandlordBookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={() => openActionDialog(booking, 'confirm')}
                    onReject={() => openActionDialog(booking, 'reject')}
                    showActions
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4 animate-fade-in">
            {confirmedBookings.length === 0 ? (
              <Card className="border-dashed bg-muted/20 shadow-none">
                <CardContent className="py-12 text-center">
                  <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Không có lịch xem phòng sắp tới</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {confirmedBookings.map((booking) => (
                  <LandlordBookingCard
                    key={booking.id}
                    booking={booking}
                    onComplete={() => openActionDialog(booking, 'complete')}
                    showCompleteButton
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 animate-fade-in">
            {historyBookings.length === 0 ? (
              <Card className="border-dashed bg-muted/20 shadow-none">
                <CardContent className="py-12 text-center">
                  <Home className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Chưa có lịch sử lịch xem phòng</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {historyBookings.map((booking) => (
                  <LandlordBookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="group cursor-pointer border border-border transition-all duration-300 hover:shadow-soft-lg" onClick={() => navigate('/post-room')}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">Đăng phòng mới</p>
                <p className="text-sm text-muted-foreground">Thêm tin cho thuê mới</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative cursor-pointer overflow-visible border border-border transition-all duration-300 hover:shadow-soft-lg" onClick={() => navigate('/messages')}>
            {messagesUnreadCount > 0 ? (
              <span className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white shadow-md animate-pulse">
                {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
              </span>
            ) : null}
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 transition-transform group-hover:scale-110">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">Tin nhắn</p>
                <p className="text-sm text-muted-foreground">
                  {messagesUnreadCount > 0 ? `${messagesUnreadCount} tin nhắn chưa đọc` : 'Xem toàn bộ tin nhắn'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border border-border transition-all duration-300 hover:shadow-soft-lg" onClick={() => navigate('/profile')}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 transition-transform group-hover:scale-110">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">Hồ sơ host</p>
                <p className="text-sm text-muted-foreground">Cập nhật thông tin và trạng thái tài khoản</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(actionType)} onOpenChange={closeActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'confirm' && 'Xác nhận lịch xem phòng'}
              {actionType === 'reject' && 'Từ chối lịch xem phòng'}
              {actionType === 'complete' && 'Hoàn thành lịch xem phòng'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'confirm' && 'Xác nhận rằng bạn sẽ gặp khách vào thời gian đã hẹn.'}
              {actionType === 'reject' && 'Hãy cho khách biết lý do bạn không thể xác nhận lịch xem phòng.'}
              {actionType === 'complete' && 'Đánh dấu lịch xem phòng này đã hoàn thành sau khi bạn gặp khách.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder={
                actionType === 'confirm'
                  ? 'Thêm ghi chú cho khách (không bắt buộc)...'
                  : actionType === 'reject'
                    ? 'Lý do từ chối...'
                    : 'Ghi chú về buổi xem phòng...'
              }
              value={actionNotes}
              onChange={(event) => setActionNotes(event.target.value)}
              className="min-h-[100px] rounded-xl focus-visible:ring-primary"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeActionDialog} disabled={isProcessing} className="rounded-xl">
              Hủy
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              className={`rounded-xl ${
                actionType === 'reject'
                  ? 'bg-destructive text-white hover:bg-destructive/90'
                  : actionType === 'confirm'
                    ? 'bg-success text-white hover:bg-success/90'
                    : ''
              }`}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {!isProcessing && actionType === 'confirm' ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
              {!isProcessing && actionType === 'reject' ? <XCircle className="mr-2 h-4 w-4" /> : null}
              {!isProcessing && actionType === 'complete' ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
              {actionType === 'confirm' && 'Xác nhận'}
              {actionType === 'reject' && 'Từ chối'}
              {actionType === 'complete' && 'Hoàn thành'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
