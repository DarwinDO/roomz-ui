import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SurfacePanel } from "./SurfacePanel";

const toneClasses = {
  default: "bg-[var(--surface-container-lowest)] text-foreground",
  primary: "bg-[var(--surface-container-low)] text-foreground",
  secondary: "bg-[var(--secondary-container)] text-[var(--secondary-container-foreground)]",
  tertiary: "bg-[var(--tertiary-container)] text-[var(--tertiary-container-foreground)]",
  inverse: "bg-white/10 text-white backdrop-blur-xl",
} as const;

type MetricCardProps = {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  tone?: keyof typeof toneClasses;
  className?: string;
};

export function MetricCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = "default",
  className,
}: MetricCardProps) {
  return (
    <SurfacePanel
      tone={tone === "inverse" ? "glass" : "lowest"}
      padding="sm"
      className={cn("rounded-[26px] border-transparent shadow-none", toneClasses[tone], className)}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px]",
            tone === "inverse"
              ? "bg-white/12 text-white"
              : "bg-white/72 text-[var(--primary)] shadow-[0_12px_24px_rgba(40,43,81,0.08)]",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {eyebrow ? (
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.2em]",
                tone === "inverse" ? "text-slate-200" : "text-muted-foreground",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <p className="mt-1 text-base font-semibold tracking-[-0.02em]">{title}</p>
          <p
            className={cn(
              "mt-1 text-sm leading-6",
              tone === "inverse" ? "text-slate-200" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </SurfacePanel>
  );
}
