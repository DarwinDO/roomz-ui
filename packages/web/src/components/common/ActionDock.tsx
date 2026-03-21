import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SurfacePanel } from "./SurfacePanel";

type ActionDockProps = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function ActionDock({
  eyebrow,
  title,
  description,
  className,
  children,
}: ActionDockProps) {
  return (
    <SurfacePanel tone="glass" className={cn("rounded-[28px] p-3 md:p-4", className)}>
      {(eyebrow || title || description) && (
        <div className="mb-3 space-y-2 px-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          {title ? <div className="text-base font-semibold text-foreground">{title}</div> : null}
          {description ? (
            <p className="max-w-[60ch] text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}

      {children}
    </SurfacePanel>
  );
}
