/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "font-display inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius)-4px)] text-sm font-semibold tracking-[-0.01em] transition-[transform,box-shadow,background-color,color,border-color,opacity] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[image:var(--cta-primary)] text-primary-foreground shadow-[0_24px_52px_-28px_rgba(0,80,212,0.72)] hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-30px_rgba(0,80,212,0.74)]",
        destructive:
          "border border-transparent bg-destructive text-white shadow-[0_22px_44px_-28px_rgba(179,27,37,0.65)] hover:-translate-y-0.5 hover:bg-destructive/92 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[color:var(--outline-variant)] bg-white/82 text-foreground shadow-[0_18px_34px_-28px_rgba(40,43,81,0.34)] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[var(--surface-container-lowest)] hover:text-foreground dark:bg-[var(--surface-container-low)] dark:hover:bg-[var(--surface-container)]",
        secondary:
          "border border-transparent bg-[image:var(--cta-secondary)] text-[var(--secondary-container-foreground)] shadow-[0_24px_52px_-30px_rgba(243,168,78,0.54)] hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-30px_rgba(243,168,78,0.6)]",
        ghost:
          "text-foreground/82 hover:bg-[var(--surface-container-high)] hover:text-foreground dark:hover:bg-[var(--surface-container)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-[calc(var(--radius)-6px)] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-[calc(var(--radius)-2px)] px-6 text-[0.95rem] has-[>svg]:px-4",
        icon: "size-10 rounded-[calc(var(--radius)-6px)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };


