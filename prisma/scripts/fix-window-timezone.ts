/**
 * Migrazione una-tantum: corregge gli orari salvati da un server in UTC.
 *
 * Contesto (vedi [[lib/timezone.ts]]): prima del fix sul fuso, un server in UTC
 * interpretava la stringa naive "2026-06-25T17:00" come 17:00 **UTC**, salvando
 * un istante sbagliato di +1/+2h rispetto all'ora italiana voluta. Questo script
 * legge i componenti "da muro" in UTC dell'istante salvato (17:00) e li
 * reinterpreta come ora di `Europe/Rome`, ottenendo l'istante corretto. L'offset
 * (e quindi l'ora legale) lo gestisce il runtime: per questo lo script DEVE
 * girare con `TZ=Europe/Rome`.
 *
 *   Dry-run (default, non scrive nulla):
 *     TZ=Europe/Rome npx tsx prisma/scripts/fix-window-timezone.ts
 *   Applica davvero:
 *     TZ=Europe/Rome npx tsx prisma/scripts/fix-window-timezone.ts --apply
 *
 * ⚠️ Eseguire UNA SOLA VOLTA, e solo su dati creati da un server UTC. Rieseguirlo
 * o lanciarlo su dati già corretti li sposterebbe di nuovo. Fai un backup prima.
 */
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

/** Reinterpreta i componenti "da muro" (letti in UTC) come ora locale del runtime. */
function reinterpretUtcWallAsLocal(d: Date): Date {
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds(),
  );
}

const fmt = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

async function main() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz !== "Europe/Rome") {
    console.error(
      `❌ Runtime TZ = "${tz}". Riavvia con TZ=Europe/Rome, altrimenti la ` +
        `conversione sarebbe sbagliata.`,
    );
    process.exit(1);
  }

  console.log(
    APPLY
      ? "🔧 MODALITÀ APPLY — scrivo le correzioni sul database.\n"
      : "🔍 DRY-RUN — nessuna scrittura. Aggiungi --apply per applicare.\n",
  );

  const windows = await prisma.openingWindow.findMany({
    select: { id: true, startTime: true, endTime: true },
  });
  const slots = await prisma.bookingSlot.findMany({
    select: { id: true, startTime: true, endTime: true },
  });

  console.log(
    `Trovate ${windows.length} finestre e ${slots.length} slot da correggere.\n`,
  );

  for (const w of windows) {
    const start = reinterpretUtcWallAsLocal(w.startTime);
    const end = reinterpretUtcWallAsLocal(w.endTime);
    console.log(
      `Finestra ${w.id}: ${fmt.format(w.startTime)}–${fmt.format(w.endTime)} ` +
        `→ ${fmt.format(start)}–${fmt.format(end)}`,
    );
    if (APPLY) {
      await prisma.openingWindow.update({
        where: { id: w.id },
        data: { startTime: start, endTime: end },
      });
    }
  }

  for (const s of slots) {
    const start = reinterpretUtcWallAsLocal(s.startTime);
    const end = reinterpretUtcWallAsLocal(s.endTime);
    if (APPLY) {
      await prisma.bookingSlot.update({
        where: { id: s.id },
        data: { startTime: start, endTime: end },
      });
    }
  }

  console.log(
    APPLY
      ? "\n✅ Correzioni applicate."
      : "\nℹ️  Controlla le righe sopra, poi rilancia con --apply.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
