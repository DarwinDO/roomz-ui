import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/88 selection:bg-primary selection:text-primary-foreground border-[color:var(--outline-variant)] flex h-11 w-full min-w-0 rounded-[calc(var(--radius)-2px)] border bg-[var(--surface-container-lowest)] px-4 py-2 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_24px_-24px_rgba(40,43,81,0.28)] transition-[color,box-shadow,border-color,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-[var(--surface-container-low)]",
        "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[4px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };


