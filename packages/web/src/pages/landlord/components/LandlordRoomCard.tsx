import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Edit, Eye, Heart, Home } from "lucide-react";
import type { RoomWithDetails } from "@/services/rooms";

interface LandlordRoomCardProps {
  room: RoomWithDetails;
  status: "pending" | "active" | "rejected";
}

function formatPrice(price: number | string | null | undefined) {
  if (!price) {
    return "-";
  }

  return `${(Number(price) / 1_000_000).toFixed(1)}tr/tháng`;
}

export function LandlordRoomCard({ room, status }: LandlordRoomCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden border border-border shadow-soft transition-all duration-300 hover:shadow-soft-lg">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div
            className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-gray-100"
            onClick={() => navigate(`/room/${room.id}`)}
          >
            {room.images?.[0] ? (
              <img
                src={room.images[0].image_url}
                alt={room.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Home className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="mb-1 truncate text-base font-medium transition-colors hover:text-primary"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  {room.title}
                </h3>
                <p className="truncate text-sm text-muted-foreground">{room.address}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  status === "pending"
                    ? "whitespace-nowrap border-warning/20 bg-warning/10 text-warning"
                    : status === "rejected"
                      ? "whitespace-nowrap border-destructive/20 bg-destructive/10 text-destructive"
                      : "whitespace-nowrap border-success/20 bg-success/10 text-success"
                }
              >
                {status === "pending" ? "Chờ duyệt" : status === "rejected" ? "Bị từ chối" : "Hoạt động"}
              </Badge>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{formatPrice(room.price_per_month)}</span>
              <span className="flex items-center gap-1.5 rounded bg-muted/50 px-2 py-0.5 text-xs">
                <Eye className="h-3.5 w-3.5" />
                {room.view_count || 0}
              </span>
              <span className="flex items-center gap-1.5 rounded bg-muted/50 px-2 py-0.5 text-xs">
                <Heart className="h-3.5 w-3.5" />
                {room.favorite_count || 0}
              </span>
            </div>

            {status === "pending" ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
                <Clock className="h-3.5 w-3.5" />
                Đang chờ admin duyệt. Thường hoàn tất trong 24 giờ.
              </p>
            ) : null}

            {status === "rejected" ? (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-destructive">Tin bị từ chối. Hãy chỉnh lại rồi gửi duyệt lại.</p>
                {room.rejection_reason ? (
                  <p className="rounded-md bg-destructive/5 p-2 text-xs text-muted-foreground">
                    <strong>Lý do:</strong> {room.rejection_reason}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => navigate(`/room/${room.id}`)}
              title="Xem chi tiết"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {status === "active" || status === "rejected" ? (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => navigate(`/post-room?edit=${room.id}`)}
                title="Chỉnh sửa"
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
