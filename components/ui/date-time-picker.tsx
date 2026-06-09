"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Orario di default quando si sceglie una data senza aver impostato l'ora. */
const DEFAULT_HOUR = 9;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Da `Date` a stringa `datetime-local` ("YYYY-MM-DDTHH:mm"), ora locale. */
function toInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function parseValue(v: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Selettore data+ora shadcn/ui (Popover + Calendar + input orario).
 *
 * Il valore resta una stringa `datetime-local` ("YYYY-MM-DDTHH:mm") per
 * restare compatibile con lo schema/Server Action, ma la **visualizzazione** è
 * sempre `dd/mm/yyyy` (a differenza dell'input nativo, legato al locale del
 * browser).
 */
export function DateTimePicker({
  value,
  onChange,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const date = parseValue(value);
  const timeStr = date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "";

  function handleDay(day: Date | undefined) {
    if (!day) return;
    const hours = date ? date.getHours() : DEFAULT_HOUR;
    const minutes = date ? date.getMinutes() : 0;
    onChange(
      toInputValue(
        new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          hours,
          minutes,
        ),
      ),
    );
  }

  function handleTime(event: React.ChangeEvent<HTMLInputElement>) {
    const [h, m] = event.target.value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    const base = date ?? new Date();
    onChange(
      toInputValue(
        new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m),
      ),
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-start font-normal",
            !date && "text-brand-muted/60",
          )}
        >
          <CalendarIcon className="text-brand-muted" />
          {date ? `${formatDate(date)} · ${formatTime(date)}` : "gg/mm/aaaa"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDay}
          defaultMonth={date}
          autoFocus
        />
        <div className="flex items-center gap-2 border-t border-brand-surface-muted p-3">
          <label className="text-sm font-medium text-brand-primary" htmlFor={`${id ?? "dt"}-time`}>
            Ora
          </label>
          <Input
            id={`${id ?? "dt"}-time`}
            type="time"
            value={timeStr}
            onChange={handleTime}
            className="w-auto"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
