import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-input bg-white px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition-all duration-200 ease-out-soft",
        "placeholder:text-brand-muted/50 hover:border-brand-primary/30",
        "focus-visible:border-brand-accent focus-visible:ring-4 focus-visible:ring-brand-accent/10",
        "file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
