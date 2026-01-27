/**
 * Landlord Dashboard Page
 * For landlords to manage their rooms and booking requests
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Eye,
  Plus,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Heart,
  Edit,
} from "lucide-react";
import { useLandlordBookings } from "@/hooks/useBookings";
import { useLandlordRooms } from "@/hooks/useRooms";
import { useConversations } from "@/hooks/useMessages";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import type { BookingWithDetails } from "@/services/bookings";
import type { RoomWithDetails } from "@/services/rooms";

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
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để truy cập trang quản lý chủ nhà.</p>
          <Button onClick={() => navigate("/login")}>Đăng nhập</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Quản lý chủ nhà</h1>
              <p className="text-sm text-gray-500">Dashboard cho chủ nhà</p>
            </div>
          </div>
          <Button onClick={() => navigate("/post-room")} className="rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Đăng phòng mới
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards - Combined booking and room stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Phòng của tôi</p>
                  <p className="text-2xl font-bold text-primary">{roomStats.total}</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-yellow-600">{roomStats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Lượt xem</p>
                  <p className="text-2xl font-bold text-blue-600">{roomStats.totalViews}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Yêu thích</p>
                  <p className="text-2xl font-bold text-red-500">{roomStats.totalFavorites}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { refetchBookings(); refetchRooms(); }} className="ml-auto">
              Thử lại
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="my-rooms" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 rounded-full p-1 bg-gray-100">
            <TabsTrigger value="my-rooms" className="rounded-full data-[state=active]:bg-white">
              Phòng ({rooms.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full data-[state=active]:bg-white">
              Chờ xác nhận ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-full data-[state=active]:bg-white">
              Sắp tới ({confirmedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-white">
              Lịch sử ({historyBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* My Rooms Tab */}
          <TabsContent value="my-rooms" className="space-y-4">
            {rooms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Bạn chưa đăng phòng nào</p>
                  <Button onClick={() => navigate("/post-room")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Đăng phòng đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Pending Rooms Section */}
                {pendingRooms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-yellow-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Đang chờ duyệt ({pendingRooms.length})
                    </h3>
                    <div className="grid gap-4">
                      {pendingRooms.map((room) => (
                        <RoomCard key={room.id} room={room} status="pending" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Rooms Section */}
                {activeRooms.length > 0 && (
                  <div className={pendingRooms.length > 0 ? "mt-6" : ""}>
                    <h3 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Đang hoạt động ({activeRooms.length})
                    </h3>
                    <div className="grid gap-4">
                      {activeRooms.map((room) => (
                        <RoomCard key={room.id} room={room} status="active" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Pending Bookings */}
          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Không có lịch hẹn nào đang chờ xác nhận</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onConfirm={() => openActionDialog(booking, "confirm")}
                  onReject={() => openActionDialog(booking, "reject")}
                  showActions
                />
              ))
            )}
          </TabsContent>

          {/* Confirmed Bookings */}
          <TabsContent value="confirmed" className="space-y-4">
            {confirmedBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Không có lịch hẹn sắp tới</p>
                </CardContent>
              </Card>
            ) : (
              confirmedBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onComplete={() => openActionDialog(booking, "complete")}
                  showCompleteButton
                />
              ))
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-4">
            {historyBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có lịch sử lịch hẹn</p>
                </CardContent>
              </Card>
            ) : (
              historyBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/post-room")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Đăng phòng mới</p>
                <p className="text-sm text-gray-500">Thêm tin đăng cho thuê</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer relative" onClick={() => navigate("/messages")}>
            {messagesUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium z-10">
                {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
              </span>
            )}
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Tin nhắn</p>
                <p className="text-sm text-gray-500">
                  {messagesUnreadCount > 0
                    ? `${messagesUnreadCount} tin nhắn chưa đọc`
                    : 'Xem tất cả tin nhắn'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/profile")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Hồ sơ của tôi</p>
                <p className="text-sm text-gray-500">Cập nhật thông tin</p>
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
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeActionDialog} disabled={isProcessing}>
              Hủy
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              className={
                actionType === "reject"
                  ? "bg-red-500 hover:bg-red-600"
                  : actionType === "confirm"
                    ? "bg-green-500 hover:bg-green-600"
                    : ""
              }
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

// Room Card Component for landlord dashboard
interface RoomCardProps {
  room: RoomWithDetails;
  status: "pending" | "active";
}

function RoomCard({ room, status }: RoomCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Room Image */}
          <div
            className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
            onClick={() => navigate(`/room/${room.id}`)}
          >
            {room.images?.[0] ? (
              <img
                src={room.images[0].image_url}
                alt={room.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="w-8 h-8 text-gray-300" />
              </div>
            )}
          </div>

          {/* Room Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  className="font-medium truncate cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  {room.title}
                </h3>
                <p className="text-sm text-gray-500 truncate">{room.address}</p>
              </div>
              <Badge
                className={
                  status === "pending"
                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                    : "bg-green-100 text-green-700 border-green-300"
                }
              >
                {status === "pending" ? "Chờ duyệt" : "Hoạt động"}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="font-medium text-primary">
                {room.price_per_month ? `${(Number(room.price_per_month) / 1000000).toFixed(1)}tr/tháng` : "-"}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {room.view_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {room.favorite_count || 0}
              </span>
            </div>

            {status === "pending" && (
              <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Phòng đang chờ admin duyệt (thường trong 24h)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/room/${room.id}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {status === "active" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Edit room */ }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Booking Card Component
interface BookingCardProps {
  booking: BookingWithDetails;
  onConfirm?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
  showCompleteButton?: boolean;
}

function BookingCard({ booking, onConfirm, onReject, onComplete, showActions, showCompleteButton }: BookingCardProps) {
  const navigate = useNavigate();
  const tenantName = booking.tenant?.full_name || booking.contact_name || "Khách";
  const tenantInitials = tenantName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const bookingDateTime = booking.booking_date && booking.booking_time
    ? `${format(parseISO(booking.booking_date), "EEEE, dd/MM/yyyy", { locale: vi })} lúc ${booking.booking_time}`
    : "Chưa xác định";

  const timeAgo = booking.created_at
    ? formatDistanceToNow(parseISO(booking.created_at), { addSuffix: true, locale: vi })
    : "";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Chờ xác nhận</Badge>;
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Đã xác nhận</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Hoàn thành</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-300">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={booking.tenant?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                {tenantInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{tenantName}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {bookingDateTime}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(booking.status as string)}
            <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Info */}
        {booking.room && (
          <div
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => navigate(`/room/${booking.room?.id}`)}
          >
            {booking.room.images?.[0] && (
              <img
                src={booking.room.images[0].image_url}
                alt={booking.room.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{booking.room.title}</p>
              <p className="text-sm text-gray-500 truncate">{booking.room.address}</p>
            </div>
            <Eye className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          {(booking.contact_phone || booking.tenant?.phone) && (
            <a
              href={`tel:${booking.contact_phone || booking.tenant?.phone}`}
              className="flex items-center gap-2 text-gray-600 hover:text-primary"
            >
              <Phone className="w-4 h-4" />
              {booking.contact_phone || booking.tenant?.phone}
            </a>
          )}
          {(booking.contact_email || booking.tenant?.email) && (
            <a
              href={`mailto:${booking.contact_email || booking.tenant?.email}`}
              className="flex items-center gap-2 text-gray-600 hover:text-primary"
            >
              <Mail className="w-4 h-4" />
              {booking.contact_email || booking.tenant?.email}
            </a>
          )}
        </div>

        {/* Message */}
        {booking.message && (
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-600">
              <MessageCircle className="w-4 h-4 inline-block mr-2 text-blue-500" />
              {booking.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onReject}>
              <XCircle className="w-4 h-4 mr-2" />
              Từ chối
            </Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={onConfirm}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Xác nhận
            </Button>
          </div>
        )}

        {showCompleteButton && (
          <div className="pt-2">
            <Button className="w-full" onClick={onComplete}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Đánh dấu hoàn thành
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
