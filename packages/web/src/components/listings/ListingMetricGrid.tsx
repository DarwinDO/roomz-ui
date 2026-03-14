import type { LucideIcon } from "lucide-react";

interface ListingMetricItem {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface ListingMetricGridProps {
  items: ListingMetricItem[];
}

export function ListingMetricGrid({ items }: ListingMetricGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <item.icon className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
          </div>
          <p className="text-sm font-medium text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
