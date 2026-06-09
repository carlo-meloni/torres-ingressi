"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { it } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Calendario shadcn/ui su react-day-picker (v10), stilizzato sui token brand.
 * Locale italiano, settimana che inizia di lunedì.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={it}
      weekStartsOn={1}
      className={cn("p-3", className)}
      classNames={{
        months: cn("flex flex-col gap-4", defaults.months),
        month: cn("flex flex-col gap-4", defaults.month),
        month_caption: cn(
          "relative flex h-9 items-center justify-center",
          defaults.month_caption,
        ),
        caption_label: cn(
          "text-sm font-medium text-brand-primary capitalize",
          defaults.caption_label,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex items-center justify-between",
          defaults.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0",
          defaults.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0",
          defaults.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaults.month_grid),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn(
          "w-9 text-xs font-normal text-brand-muted",
          defaults.weekday,
        ),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn("relative size-9 p-0 text-center text-sm", defaults.day),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 rounded-md p-0 font-normal",
          defaults.day_button,
        ),
        today: cn(
          "rounded-md bg-brand-surface font-semibold text-brand-primary",
          defaults.today,
        ),
        selected: cn(
          "rounded-md [&>button]:bg-brand-accent [&>button]:text-white [&>button]:hover:bg-brand-accent-hover [&>button]:hover:text-white",
          defaults.selected,
        ),
        outside: cn("text-brand-muted/40", defaults.outside),
        disabled: cn("text-brand-muted/30 opacity-50", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon;
          return <Icon className={cn("size-4", chevronClassName)} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
