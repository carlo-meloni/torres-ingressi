import type { CalendarDay, CalendarSlot } from "@/types/booking";
import { SLOT_STATUS_META, STATUS_LEGEND } from "@/lib/slot-status";

interface SlotPickerProps {
  day: CalendarDay;
  selectedSlotId: string | null;
  onSelect: (slot: CalendarSlot) => void;
}

/**
 * Griglia degli slot di una giornata, con codice colore per lo stato.
 * Gli slot completi o chiusi non sono selezionabili.
 */
export default function SlotPicker({
  day,
  selectedSlotId,
  onSelect,
}: SlotPickerProps) {
  if (day.slots.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-surface-muted bg-white px-5 py-10 text-center text-sm text-brand-muted">
        Biglietteria chiusa in questa giornata. Scegli un altro giorno.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Legenda colori */}
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {STATUS_LEGEND.map((status) => {
          const meta = SLOT_STATUS_META[status];
          return (
            <li
              key={status}
              className="flex items-center gap-2 text-xs text-brand-muted"
            >
              <span className={`size-2.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </li>
          );
        })}
      </ul>

      {/* Griglia slot */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {day.slots.map((slot) => {
          const meta = SLOT_STATUS_META[slot.status];
          const isSelected = slot.id === selectedSlotId;

          return (
            <button
              key={slot.id}
              type="button"
              disabled={!meta.selectable}
              onClick={() => onSelect(slot)}
              aria-pressed={isSelected}
              className={[
                "group relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-sm font-semibold transition-all duration-200",
                isSelected
                  ? "border-brand-accent bg-brand-accent text-white shadow-md shadow-brand-accent/25"
                  : meta.selectable
                    ? "border-brand-surface-muted bg-white text-brand-primary hover:-translate-y-0.5 hover:border-brand-accent/50 hover:shadow-sm"
                    : "cursor-not-allowed border-brand-surface-muted bg-brand-surface text-brand-muted/60",
              ].join(" ")}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${isSelected ? "bg-white" : meta.dot}`}
                />
                {slot.time}
              </span>
              <span
                className={`text-[0.7rem] font-medium ${
                  isSelected ? "text-white/80" : "text-brand-muted"
                }`}
              >
                {meta.selectable
                  ? `${slot.seatsLeft} ${slot.seatsLeft === 1 ? "posto" : "posti"}`
                  : meta.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
