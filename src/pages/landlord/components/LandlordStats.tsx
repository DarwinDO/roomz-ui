import { Card, CardContent } from "@/components/ui/card";
import { Home, Clock, Eye, Heart } from "lucide-react";

interface LandlordStatsProps {
    stats: {
        total: number;
        pending: number;
        active: number;
        totalViews: number;
        totalFavorites: number;
    };
}

export function LandlordStats({ stats }: LandlordStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <CardContent className="pt-4 px-4 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Phòng của tôi</p>
                            <p className="text-2xl font-bold text-primary">{stats.total}</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Home className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <CardContent className="pt-4 px-4 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Chờ duyệt</p>
                            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                        </div>
                        <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-warning" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <CardContent className="pt-4 px-4 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Lượt xem</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <CardContent className="pt-4 px-4 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Yêu thích</p>
                            <p className="text-2xl font-bold text-destructive">{stats.totalFavorites}</p>
                        </div>
                        <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                            <Heart className="w-5 h-5 text-destructive" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
