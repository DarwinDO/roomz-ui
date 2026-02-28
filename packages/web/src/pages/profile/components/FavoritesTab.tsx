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

    const handleRemove = async (roomId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await onRemoveFavorite(roomId);
            toast.success("Đã xóa khỏi yêu thích");
        } catch (err) {
            console.error('Error removing favorite:', err);
            toast.error("Không thể xóa khỏi yêu thích");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <ServicesBanner />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3>Phòng đã lưu ({savedRooms.length})</h3>
                    {savedRooms.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefetch}
                            className="rounded-xl border-border hover:bg-muted"
                        >
                            Làm mới
                        </Button>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
                                <div className="h-48 bg-muted animate-skeleton" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 bg-muted rounded animate-skeleton w-3/4" />
                                    <div className="h-4 bg-muted rounded animate-skeleton w-1/2" />
                                    <div className="h-4 bg-muted rounded animate-skeleton w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 text-center animate-fade-in">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={onRefetch} variant="outline" className="rounded-xl">
                            Thử lại
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && savedRooms.length === 0 && (
                    <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center animate-fade-in">
                        <Heart className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Chưa có phòng yêu thích</h3>
                        <p className="text-muted-foreground mb-4">Lưu các phòng bạn thích để xem lại sau</p>
                        <Button onClick={() => navigate('/search')} variant="default" className="rounded-xl">
                            Tìm kiếm phòng
                        </Button>
                    </div>
                )}

                {/* Favorites List */}
                {!loading && !error && savedRooms.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {savedRooms.map((room) => (
                            <div key={room.id} className="relative group">
                                <div onClick={() => handleRoomClick(room.id)}>
                                    <RoomCard
                                        {...room}
                                        isFavorited={true}
                                        showFavoriteButton={false}
                                    />
                                </div>
                                {/* Action buttons in top-right corner where heart icon would be */}
                                <div className="absolute top-3 right-3 flex gap-2 z-10">
                                    <Button
                                        onClick={(e) => handleRemove(room.id, e)}
                                        size="icon"
                                        className="rounded-full bg-card hover:bg-destructive/10 h-9 w-9 shadow-md border-0"
                                        variant="ghost"
                                        title="Xóa khỏi yêu thích"
                                    >
                                        <Heart className="w-5 h-5 fill-destructive text-destructive" />
                                    </Button>
                                </div>
                                {/* View button on hover at bottom-right */}
                                <div className="absolute bottom-16 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRoomClick(room.id);
                                        }}
                                        size="sm"
                                        className="rounded-full bg-white/95 hover:bg-white shadow-md text-primary"
                                        variant="ghost"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Xem
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
