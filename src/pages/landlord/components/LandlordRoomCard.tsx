import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Eye, Heart, Clock, Edit } from "lucide-react";
import type { RoomWithDetails } from "@/services/rooms";

interface LandlordRoomCardProps {
    room: RoomWithDetails;
    status: "pending" | "active";
}

export function LandlordRoomCard({ room, status }: LandlordRoomCardProps) {
    const navigate = useNavigate();

    return (
        <Card className="overflow-hidden shadow-soft hover-lift transition-all duration-300 border border-border group">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Room Image */}
                    <div
                        className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer relative"
                        onClick={() => navigate(`/room/${room.id}`)}
                    >
                        {room.images?.[0] ? (
                            <img
                                src={room.images[0].image_url}
                                alt={room.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Home className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3
                                    className="font-medium truncate cursor-pointer hover:text-primary transition-colors text-base mb-1"
                                    onClick={() => navigate(`/room/${room.id}`)}
                                >
                                    {room.title}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">{room.address}</p>
                            </div>
                            <Badge
                                variant="outline"
                                className={
                                    status === "pending"
                                        ? "bg-warning/10 text-warning border-warning/20 whitespace-nowrap"
                                        : "bg-success/10 text-success border-success/20 whitespace-nowrap"
                                }
                            >
                                {status === "pending" ? "Chờ duyệt" : "Hoạt động"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">
                                {room.price_per_month ? `${(Number(room.price_per_month) / 1000000).toFixed(1)}tr/tháng` : "-"}
                            </span>
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-xs">
                                <Eye className="w-3.5 h-3.5" />
                                {room.view_count || 0}
                            </span>
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-xs">
                                <Heart className="w-3.5 h-3.5" />
                                {room.favorite_count || 0}
                            </span>
                        </div>

                        {status === "pending" && (
                            <p className="text-xs text-warning mt-2 flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                Đang chờ admin duyệt (thường trong 24h)
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => navigate(`/room/${room.id}`)}
                            title="Xem chi tiết"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                        {status === "active" && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => {/* TODO: Edit room */ }}
                                title="Chỉnh sửa"
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
