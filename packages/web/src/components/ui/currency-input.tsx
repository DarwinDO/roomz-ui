import * as React from "react";

import { formatCurrencyInput, sanitizeCurrencyInput } from "@/lib/currency";

import { Input } from "./input";
import { cn } from "./utils";

type CurrencyInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value?: string | number | null;
  onValueChange: (value: string) => void;
};

function CurrencyInput({
  value,
  onValueChange,
  className,
  autoComplete = "off",
  ...props
}: CurrencyInputProps) {
  return (
    <Input
      {...props}
      autoComplete={autoComplete}
      className={cn("tabular-nums", className)}
      inputMode="numeric"
      type="text"
      value={formatCurrencyInput(value)}
      onChange={(event) => onValueChange(sanitizeCurrencyInput(event.target.value))}
    />
  );
}

export { CurrencyInput };
