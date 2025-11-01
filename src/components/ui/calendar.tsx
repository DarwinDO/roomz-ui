"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { vi } from "date-fns/locale";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames: classNamesProp,
  components: componentsProp,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = React.useMemo(() => getDefaultClassNames(), []);

  return (
    <DayPicker
      locale={vi}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        ...defaultClassNames,
        months: cn(
          "flex flex-col sm:flex-row gap-2",
          defaultClassNames.months,
        ),
        month: cn("flex-1 space-y-4", defaultClassNames.month),
        month_caption: cn(
          "flex justify-center pt-1 relative items-center w-full",
          defaultClassNames.month_caption,
        ),
        caption_label: cn("text-sm font-medium", defaultClassNames.caption_label),
        nav: cn("flex items-center gap-1", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          defaultClassNames.button_next,
        ),
        chevron: cn("size-4", defaultClassNames.chevron),
        table: "w-full border-collapse",
        weekdays: cn("w-full", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md font-normal text-[0.8rem] text-center",
          defaultClassNames.weekday,
        ),
        week: cn("w-full", defaultClassNames.week),
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&[data-selected]>.day-button]:bg-primary [&[data-selected]>.day-button]:text-primary-foreground [&[data-selected]>.day-button:hover]:bg-primary [&[data-selected]>.day-button:focus-visible]:bg-primary",
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "day-button h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          defaultClassNames.day_button,
        ),
        selected: cn(
          "[&>.day-button]:rounded-md [&>.day-button]:bg-primary [&>.day-button]:text-primary-foreground",
          defaultClassNames.selected,
        ),
        range_start: cn(
          "[&>.day-button]:rounded-l-md [&>.day-button]:bg-primary [&>.day-button]:text-primary-foreground",
          defaultClassNames.range_start,
        ),
        range_end: cn(
          "[&>.day-button]:rounded-r-md [&>.day-button]:bg-primary [&>.day-button]:text-primary-foreground",
          defaultClassNames.range_end,
        ),
        range_middle: cn(
          "[&>.day-button]:rounded-none [&>.day-button]:bg-accent [&>.day-button]:text-accent-foreground",
          defaultClassNames.range_middle,
        ),
        today: cn(
          "[&>.day-button]:bg-accent [&>.day-button]:text-accent-foreground",
          defaultClassNames.today,
        ),
        outside: cn(
          "[&>.day-button]:text-muted-foreground [&[data-selected]>.day-button]:bg-accent [&[data-selected]>.day-button]:text-accent-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "[&>.day-button]:text-muted-foreground [&>.day-button]:opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNamesProp,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeft
                className={cn("size-4", chevronClassName)}
                {...chevronProps}
              />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRight
                className={cn("size-4", chevronClassName)}
                {...chevronProps}
              />
            );
          }
          if (orientation === "up") {
            return (
              <ChevronUp
                className={cn("size-4", chevronClassName)}
                {...chevronProps}
              />
            );
          }
          return (
            <ChevronDown
              className={cn("size-4", chevronClassName)}
              {...chevronProps}
            />
          );
        },
        ...componentsProp,
      }}
      {...props}
    />
  );
}

export { Calendar };
