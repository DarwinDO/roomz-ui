import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SurfacePanel } from "./SurfacePanel";

type EditorialHeroProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  badges?: string[];
  actions?: ReactNode;
  supporting?: ReactNode;
  artwork: ReactNode;
  className?: string;
};

export function EditorialHero({
  eyebrow,
  title,
  description,
  badges = [],
  actions,
  supporting,
  artwork,
  className,
}: EditorialHeroProps) {
  return (
    <SurfacePanel tone="hero" padding="none" className={cn("overflow-hidden", className)}>
      <div className="grid gap-0 lg:grid-cols-[0.98fr_1.02fr]">
        <div className="px-6 py-7 md:px-8 md:py-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary shadow-[0_10px_24px_rgba(40,43,81,0.08)]">
            {eyebrow}
          </div>

          <div className="mt-6 max-w-[15ch] text-balance text-foreground">{title}</div>
          <p className="mt-4 max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-base">
            {description}
          </p>

          {badges.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge
                  key={badge}
                  variant="outline"
                  className="rounded-full border-transparent bg-white/72 px-3 py-1 text-[11px] text-foreground shadow-[0_12px_24px_rgba(40,43,81,0.06)]"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}

          {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
          {supporting ? <div className="mt-7">{supporting}</div> : null}
        </div>

        <div className="px-4 pb-4 pt-0 md:px-6 md:pb-6 lg:border-l lg:border-white/30 lg:px-7 lg:py-7">
          {artwork}
        </div>
      </div>
    </SurfacePanel>
  );
}
