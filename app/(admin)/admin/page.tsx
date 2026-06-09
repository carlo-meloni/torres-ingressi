import Link from "next/link";

import { prisma } from "@/lib/prisma";

/** Inizio e fine della giornata corrente (ora locale del server). */
function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

type Stat = {
  label: string;
  value: number;
  hint: string;
};

function StatCard({ label, value, hint }: Stat) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-brand-surface-muted bg-white p-6">
      <span className="text-sm font-medium text-brand-muted">{label}</span>
      <span className="text-4xl font-bold tabular-nums text-brand-primary">
        {value}
      </span>
      <span className="text-xs text-brand-muted">{hint}</span>
    </div>
  );
}

/** Overview dell'area admin: indicatori sintetici letti da Prisma. */
export default async function AdminOverviewPage() {
  const { start, end } = todayRange();

  const [activeCounters, bookingsToday, inQueue, servedToday] =
    await Promise.all([
      prisma.counter.count({ where: { isActive: true } }),
      prisma.booking.count({
        where: { slot: { startTime: { gte: start, lt: end } } },
      }),
      prisma.booking.count({ where: { status: "IN_CODA" } }),
      prisma.booking.count({
        where: { status: "SERVITA", updatedAt: { gte: start, lt: end } },
      }),
    ]);

  const stats: Stat[] = [
    {
      label: "Sportelli attivi",
      value: activeCounters,
      hint: "abilitati alle aperture",
    },
    {
      label: "Prenotazioni oggi",
      value: bookingsToday,
      hint: "turni in programma oggi",
    },
    { label: "In coda", value: inQueue, hint: "in attesa di chiamata" },
    { label: "Serviti oggi", value: servedToday, hint: "completati oggi" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-brand-primary">Overview</h1>
        <p className="text-sm text-brand-muted">
          Riepilogo della biglietteria in tempo reale.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-accent">
          Azioni rapide
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              href: "/admin/aperture",
              title: "Apri uno sportello",
              desc: "Crea una finestra di apertura e genera i turni.",
            },
            {
              href: "/admin/sportelli",
              title: "Gestisci sportelli",
              desc: "Aggiungi o disattiva gli sportelli della biglietteria.",
            },
            {
              href: "/admin/prenotazioni",
              title: "Vedi prenotazioni",
              desc: "Consulta e gestisci le prenotazioni dei tifosi.",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col gap-2 rounded-2xl border border-brand-surface-muted bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg hover:shadow-brand-primary/5"
            >
              <span className="font-semibold text-brand-primary group-hover:text-brand-accent">
                {card.title}
              </span>
              <span className="text-sm leading-relaxed text-brand-muted">
                {card.desc}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
