import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideProps } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.FC<LucideProps>;
  variant?: "default" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-green-100 text-green-600",
  warning: "bg-orange-100 text-orange-600",
  info: "bg-blue-100 text-blue-600",
};

export function StatsCard({ title, value, change, icon: Icon, variant = "default" }: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="p-6 border-none shadow-soft hover:shadow-soft-lg transition-all duration-300 rounded-2xl group cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"} w-fit px-2 py-0.5 rounded-full`}>
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
              )}
              <span className="font-medium">
                {isPositive ? "+" : ""}{change}%
              </span>
              <span className="text-gray-400 font-normal ml-1">vs tháng trước</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${variantStyles[variant]} shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </Card>
  );
}

