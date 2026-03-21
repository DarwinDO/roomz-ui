import { Button } from "@/components/ui/button";
import { AlertCircle, Eye, Heart } from "lucide-react";
import { RoomCard } from "@/components/common/RoomCard";
import { ServicesBanner } from "@/components/common/ServicesBanner";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type RoomCardData = {
  id: string;
  image: string;
  title: string;
  location: string;
  price: number;
  distance?: string;
  verified: boolean;
  available: boolean;
  matchPercentage?: number;
  isFavorited?: boolean;
};

interface FavoritesTabProps {
  savedRooms: RoomCardData[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  onRemoveFavorite: (roomId: string) => Promise<void>;
}

export function FavoritesTab({
  savedRooms,
  loading,
  error,
  onRefetch,
  onRemoveFavorite,
}: FavoritesTabProps) {
  const navigate = useNavigate();

  const handleRoomClick = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleRemove = async (roomId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await onRemoveFavorite(roomId);
      toast.success("Đã xóa khỏi yêu thích");
    } catch (err) {
      console.error("Error removing favorite:", err);
      toast.error("Không thể xóa khỏi yêu thích");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <ServicesBanner />

      <section className="space-y-5 rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Saved listings
            </p>
            <h3 className="mt-2 text-2xl text-foreground">Phòng đã lưu ({savedRooms.length})</h3>
            <p className="mt-2 max-w-[60ch] text-sm leading-7 text-muted-foreground">
              Đây là nhóm tin đăng bạn đang cân nhắc lại. Từ đây bạn có thể quay lại xem nhanh, so sánh,
              và liên hệ tiếp khi cần chốt nơi ở.
            </p>
          </div>

          {savedRooms.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefetch}
              className="rounded-full border-border px-4 hover:bg-muted"
            >
              Làm mới
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="grid gap-4 stagger-children sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-soft"
              >
                <div className="h-48 animate-skeleton bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 animate-skeleton rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-skeleton rounded bg-muted" />
                  <div className="h-4 w-1/3 animate-skeleton rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {error && !loading ? (
          <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
            <p className="mb-4 text-destructive">{error}</p>
            <Button onClick={onRefetch} variant="outline" className="rounded-full px-4">
              Thử lại
            </Button>
          </div>
        ) : null}

        {!loading && !error && savedRooms.length === 0 ? (
          <div className="rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,#f6f8fb_0%,#fffdf9_100%)] p-12 text-center shadow-soft">
            <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-xl font-semibold">Chưa có phòng yêu thích</h3>
            <p className="mx-auto mb-4 max-w-md text-muted-foreground">
              Lưu các tin phù hợp để quay lại so sánh sau. Khi search hoặc xem chi tiết, bạn có thể đánh
              dấu ngay những phòng đáng cân nhắc nhất.
            </p>
            <Button onClick={() => navigate("/search")} className="rounded-full px-5">
              Tìm kiếm phòng
            </Button>
          </div>
        ) : null}

        {!loading && !error && savedRooms.length > 0 ? (
          <div className="grid gap-4 stagger-children sm:grid-cols-2 lg:grid-cols-3">
            {savedRooms.map((room) => (
              <div key={room.id} className="group relative">
                <RoomCard
                  {...room}
                  isFavorited
                  showFavoriteButton={false}
                  onClick={handleRoomClick}
                />

                <div className="absolute right-3 top-3 z-10 flex gap-2">
                  <Button
                    onClick={(event) => handleRemove(room.id, event)}
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full border-0 bg-card shadow-md hover:bg-destructive/10"
                    title="Xóa khỏi yêu thích"
                    aria-label="Xóa khỏi yêu thích"
                  >
                    <Heart className="h-5 w-5 fill-destructive text-destructive" />
                  </Button>
                </div>

                <div className="absolute bottom-16 right-3 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRoomClick(room.id);
                    }}
                    size="sm"
                    variant="ghost"
                    className="rounded-full bg-white/95 text-primary shadow-md hover:bg-white"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Xem
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
