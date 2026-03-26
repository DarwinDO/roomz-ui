import { createElement, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneClasses = {
  default:
    "border border-[color:var(--border)] bg-card/92 text-card-foreground shadow-soft",
  low: "border border-[color:var(--border)] bg-[var(--surface-container-low)] text-foreground shadow-soft",
  lowest:
    "border border-[color:var(--border)] bg-[var(--surface-container-lowest)] text-foreground shadow-soft",
  hero:
    "border border-[color:var(--border)] bg-[var(--atlas-panel-hero)] text-foreground shadow-soft-lg",
  inverse:
    "border border-white/10 bg-[var(--atlas-panel-inverse)] text-white shadow-soft-lg",
  glass:
    "border border-white/30 bg-white/72 text-foreground shadow-soft backdrop-blur-2xl",
} as const;

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-7 md:p-8",
} as const;

type SurfacePanelProps<T extends ElementType = "div"> = {
  as?: T;
  tone?: keyof typeof toneClasses;
  padding?: keyof typeof paddingClasses;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function SurfacePanel<T extends ElementType = "div">({
  as,
  tone = "default",
  padding = "md",
  className,
  children,
  ...props
}: SurfacePanelProps<T>) {
  const Component = (as ?? "div") as ElementType;
  const componentProps = props as ComponentPropsWithoutRef<ElementType>;

  return createElement(
    Component,
    {
      className: cn(
        "rounded-[32px]",
        toneClasses[tone],
        paddingClasses[padding],
        className,
      ),
      ...componentProps,
    },
    children,
  );
}
