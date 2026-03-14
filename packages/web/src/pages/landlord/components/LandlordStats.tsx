import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, Eye, Heart, Home } from "lucide-react";

interface LandlordStatsProps {
  stats: {
    total: number;
    pending: number;
    active: number;
    rejected: number;
    totalViews: number;
    totalFavorites: number;
  };
}

export function LandlordStats({ stats }: LandlordStatsProps) {
  const cards = [
    {
      label: "Tổng listing",
      value: stats.total,
      icon: Home,
      iconClassName: "bg-primary/10 text-primary",
      valueClassName: "text-primary",
    },
    {
      label: "Chờ duyệt",
      value: stats.pending,
      icon: Clock,
      iconClassName: "bg-warning/10 text-warning",
      valueClassName: "text-warning",
    },
    {
      label: "Cần chỉnh sửa",
      value: stats.rejected,
      icon: AlertTriangle,
      iconClassName: "bg-destructive/10 text-destructive",
      valueClassName: "text-destructive",
    },
    {
      label: "Lượt xem",
      value: stats.totalViews,
      icon: Eye,
      iconClassName: "bg-blue-100 text-blue-600",
      valueClassName: "text-blue-600",
    },
    {
      label: "Lượt lưu",
      value: stats.totalFavorites,
      icon: Heart,
      iconClassName: "bg-rose-100 text-rose-600",
      valueClassName: "text-rose-600",
    },
  ] as const;

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} className="border border-border shadow-soft transition-all duration-300 hover:shadow-soft-lg">
            <CardContent className="px-4 pb-4 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.valueClassName}`}>{card.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconClassName}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
