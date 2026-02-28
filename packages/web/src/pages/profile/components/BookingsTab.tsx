import { useState } from "react";
import { Loader2, CalendarCheck, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useTenantBookings } from "@/hooks/useBookings";
import { UserBookingCard } from "./UserBookingCard";
import { toast } from "sonner";
import type { BookingWithDetails } from "@/services/bookings";

export function BookingsTab() {
    const { bookings, loading, error, cancelUserBooking, refetch } = useTenantBookings();
    const [cancellingBooking, setCancellingBooking] = useState<BookingWithDetails | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const pendingBookings = bookings.filter(b => b.status === "pending");
    const confirmedBookings = bookings.filter(b => b.status === "confirmed");
    const historyBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");

    const handleCancelBooking = async () => {
        if (!cancellingBooking) return;

        setIsProcessing(true);
        try {
            await cancelUserBooking(cancellingBooking.id, "Người dùng hủy");
            toast.success("Đã hủy lịch hẹn thành công");
            setCancellingBooking(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không thể hủy lịch hẹn";
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-3 text-muted-foreground">Đang tải lịch hẹn...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="py-8 text-center">
                    <p className="text-destructive mb-4">{error}</p>
                    <Button variant="outline" onClick={refetch}>Thử lại</Button>
                </CardContent>
            </Card>
        );
    }

    if (bookings.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarCheck className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Chưa có lịch hẹn nào</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Bạn chưa đặt lịch xem phòng nào. Hãy tìm kiếm và đặt lịch xem phòng phù hợp với bạn!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 rounded-xl">
                    <TabsTrigger value="upcoming">
                        Chờ xác nhận
                        {pendingBookings.length > 0 && (
                            <span className="ml-1.5 text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded-full">
                                {pendingBookings.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="confirmed">
                        Sắp tới
                        {confirmedBookings.length > 0 && (
                            <span className="ml-1.5 text-xs bg-success/20 text-success px-1.5 py-0.5 rounded-full">
                                {confirmedBookings.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history">Lịch sử</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    {pendingBookings.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="py-8 text-center">
                                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground">Không có lịch hẹn đang chờ xác nhận</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {pendingBookings.map((booking) => (
                                <UserBookingCard
                                    key={booking.id}
                                    booking={booking}
                                    onCancel={() => setCancellingBooking(booking)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="confirmed" className="space-y-4">
                    {confirmedBookings.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="py-8 text-center">
                                <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground">Không có lịch hẹn sắp tới</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {confirmedBookings.map((booking) => (
                                <UserBookingCard key={booking.id} booking={booking} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {historyBookings.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="py-8 text-center">
                                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground">Chưa có lịch sử lịch hẹn</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {historyBookings.map((booking) => (
                                <UserBookingCard key={booking.id} booking={booking} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={!!cancellingBooking} onOpenChange={() => setCancellingBooking(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận hủy lịch hẹn</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn hủy lịch hẹn xem phòng này không? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setCancellingBooking(null)}
                            disabled={isProcessing}
                            className="rounded-xl"
                        >
                            Không, giữ lại
                        </Button>
                        <Button
                            onClick={handleCancelBooking}
                            disabled={isProcessing}
                            className="rounded-xl bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Xác nhận hủy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
