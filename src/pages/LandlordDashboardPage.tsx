import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  Home,
  CheckCircle,
  XCircle,
  MessageCircle,
  Plus,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useLandlordBookings } from "@/hooks/useBookings";
import { useLandlordRooms } from "@/hooks/useRooms";
import { useConversations } from "@/hooks/useMessages";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import type { BookingWithDetails } from "@/services/bookings";

// Components
import { LandlordStats } from "./landlord/components/LandlordStats";
import { LandlordRoomCard } from "./landlord/components/LandlordRoomCard";
import { LandlordBookingCard } from "./landlord/components/LandlordBookingCard";

export default function LandlordDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, loading: bookingsLoading, error: bookingsError, stats: bookingStats, confirmBooking, rejectBooking, completeBooking, refetch: refetchBookings } = useLandlordBookings();
  const { rooms, loading: roomsLoading, error: roomsError, stats: roomStats, refetch: refetchRooms } = useLandlordRooms(user?.id);
  const { unreadCount: messagesUnreadCount } = useConversations();

  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "reject" | "complete" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loading = bookingsLoading || roomsLoading;
  const error = bookingsError || roomsError;

  const handleAction = async () => {
    if (!selectedBooking || !actionType) return;

    setIsProcessing(true);
    try {
      switch (actionType) {
        case "confirm":
          await confirmBooking(selectedBooking.id, actionNotes);
          toast.success("Đã xác nhận lịch hẹn");
          break;
        case "reject":
          await rejectBooking(selectedBooking.id, actionNotes);
          toast.success("Đã từ chối lịch hẹn");
          break;
        case "complete":
          await completeBooking(selectedBooking.id, actionNotes);
          toast.success("Đã hoàn thành lịch hẹn");
          break;
      }
      closeActionDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể thực hiện. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (booking: BookingWithDetails, type: "confirm" | "reject" | "complete") => {
    setSelectedBooking(booking);
    setActionType(type);
    setActionNotes("");
  };

  const closeActionDialog = () => {
    setSelectedBooking(null);
    setActionType(null);
    setActionNotes("");
  };

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const confirmedBookings = bookings.filter(b => b.status === "confirmed");
  const historyBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");

  const pendingRooms = rooms.filter(r => r.status === "pending");
  const activeRooms = rooms.filter(r => r.status === "active");

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vui lòng đăng nhập</h2>
          <p className="text-muted-foreground mb-6">Bạn cần đăng nhập để truy cập trang quản lý chủ nhà.</p>
          <Button onClick={() => navigate("/login")}>Đăng nhập</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-6 py-4 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Quản lý chủ nhà</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Dashboard tổng quan</p>
            </div>
          </div>
          <Button onClick={() => navigate("/post-room")} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Đăng phòng mới</span>
            <span className="sm:hidden">Đăng tin</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Section */}
        <LandlordStats stats={roomStats} />

        {/* Error Feedback */}
        {error && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { refetchBookings(); refetchRooms(); }} className="ml-auto border-destructive/20 hover:bg-destructive/10">
              Thử lại
            </Button>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="my-rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-xl p-1 bg-muted/50 h-auto">
            <TabsTrigger value="my-rooms" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Phòng của tôi</span>
              <span className="sm:hidden">Phòng</span>
              <span className="ml-1.5 text-xs bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">{rooms.length}</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Chờ xác nhận</span>
              <span className="sm:hidden">Chờ</span>
              <span className="ml-1.5 text-xs bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">{pendingBookings.length}</span>
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Sắp tới</span>
              <span className="sm:hidden">Sắp tới</span>
              <span className="ml-1.5 text-xs bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">{confirmedBookings.length}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Lịch sử</span>
              <span className="sm:hidden">Lịch sử</span>
            </TabsTrigger>
          </TabsList>

          {/* My Rooms Tab */}
          <TabsContent value="my-rooms" className="space-y-6 animate-fade-in">
            {rooms.length === 0 ? (
              <Card className="border-dashed border-2 shadow-none bg-transparent">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Bạn chưa đăng phòng nào</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Đăng tin phòng trống của bạn ngay để tiếp cận hàng ngàn người thuê tiềm năng.</p>
                  <Button onClick={() => navigate("/post-room")} size="lg" className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Đăng phòng đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Pending Rooms Section */}
                {pendingRooms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-warning mb-4 flex items-center gap-2 uppercase tracking-wide">
                      <Clock className="w-4 h-4" />
                      Đang chờ duyệt ({pendingRooms.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {pendingRooms.map((room) => (
                        <LandlordRoomCard key={room.id} room={room} status="pending" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Rooms Section */}
                {activeRooms.length > 0 && (
                  <div className={pendingRooms.length > 0 ? "pt-4 border-t border-border" : ""}>
                    <h3 className="text-sm font-semibold text-success mb-4 flex items-center gap-2 uppercase tracking-wide">
                      <CheckCircle className="w-4 h-4" />
                      Đang hoạt động ({activeRooms.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {activeRooms.map((room) => (
                        <LandlordRoomCard key={room.id} room={room} status="active" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Pending Bookings */}
          <TabsContent value="pending" className="space-y-4 animate-fade-in">
            {pendingBookings.length === 0 ? (
              <Card className="border-dashed shadow-none bg-muted/20">
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có lịch hẹn nào đang chờ xác nhận</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {pendingBookings.map((booking) => (
                  <LandlordBookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={() => openActionDialog(booking, "confirm")}
                    onReject={() => openActionDialog(booking, "reject")}
                    showActions
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Confirmed Bookings */}
          <TabsContent value="confirmed" className="space-y-4 animate-fade-in">
            {confirmedBookings.length === 0 ? (
              <Card className="border-dashed shadow-none bg-muted/20">
                <CardContent className="py-12 text-center">
                  <CalendarCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có lịch hẹn sắp tới</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {confirmedBookings.map((booking) => (
                  <LandlordBookingCard
                    key={booking.id}
                    booking={booking}
                    onComplete={() => openActionDialog(booking, "complete")}
                    showCompleteButton
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-4 animate-fade-in">
            {historyBookings.length === 0 ? (
              <Card className="border-dashed shadow-none bg-muted/20">
                <CardContent className="py-12 text-center">
                  <Home className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Chưa có lịch sử lịch hẹn</p>
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

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-soft-lg transition-all duration-300 cursor-pointer border border-border group" onClick={() => navigate("/post-room")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">Đăng phòng mới</p>
                <p className="text-sm text-muted-foreground">Thêm tin đăng cho thuê</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-soft-lg transition-all duration-300 cursor-pointer border border-border group relative overflow-visible" onClick={() => navigate("/messages")}>
            {messagesUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold z-10 shadow-md animate-pulse">
                {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
              </span>
            )}
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">Tin nhắn</p>
                <p className="text-sm text-muted-foreground">
                  {messagesUnreadCount > 0
                    ? `${messagesUnreadCount} tin nhắn chưa đọc`
                    : 'Xem tất cả tin nhắn'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-soft-lg transition-all duration-300 cursor-pointer border border-border group" onClick={() => navigate("/profile")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">Hồ sơ của tôi</p>
                <p className="text-sm text-muted-foreground">Cập nhật thông tin</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => closeActionDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "confirm" && "Xác nhận lịch hẹn"}
              {actionType === "reject" && "Từ chối lịch hẹn"}
              {actionType === "complete" && "Hoàn thành lịch hẹn"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "confirm" && "Xác nhận rằng bạn sẽ gặp khách vào thời gian đã hẹn."}
              {actionType === "reject" && "Hãy cho khách biết lý do bạn không thể xác nhận lịch hẹn."}
              {actionType === "complete" && "Đánh dấu lịch hẹn này đã hoàn thành sau khi gặp khách."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={
                actionType === "confirm"
                  ? "Thêm ghi chú cho khách (không bắt buộc)..."
                  : actionType === "reject"
                    ? "Lý do từ chối..."
                    : "Ghi chú về buổi xem phòng..."
              }
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
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
              className={`rounded-xl ${actionType === "reject"
                  ? "bg-destructive hover:bg-destructive/90 text-white"
                  : actionType === "confirm"
                    ? "bg-success hover:bg-success/90 text-white"
                    : ""
                }`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : actionType === "confirm" ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : actionType === "reject" ? (
                <XCircle className="w-4 h-4 mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {actionType === "confirm" && "Xác nhận"}
              {actionType === "reject" && "Từ chối"}
              {actionType === "complete" && "Hoàn thành"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
