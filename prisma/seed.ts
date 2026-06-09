// Database seed — run on demand only via `npm run db:seed`.
//
// This is intentionally NOT wired into prisma.config.ts, so it never runs
// automatically on `prisma migrate dev` / `prisma migrate reset`.
//
// Standalone script (not Next.js), so we load env explicitly and build our own
// client with the Neon adapter. Re-runnable: every write is an idempotent upsert.

import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { Role } from "../generated/prisma/enums";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Initial sportelli. Names are treated as the natural key for idempotency.
const COUNTERS: { name: string; description: string }[] = [
  { name: "Sportello 1", description: "Cassa principale" },
  { name: "Sportello 2", description: "Cassa secondaria" },
  { name: "Cassa Tribuna", description: "Dedicata agli abbonamenti di tribuna" },
];

async function seedSysadmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@torres.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: Role.SYSADMIN },
    create: {
      email,
      name: "Torres Sysadmin",
      role: Role.SYSADMIN,
      password: passwordHash,
    },
  });

  console.log(`  ✓ SYSADMIN ready: ${user.email}`);
}

async function seedCounters() {
  for (const data of COUNTERS) {
    // Counter.name has no unique constraint, so guard against duplicates by name.
    const existing = await prisma.counter.findFirst({ where: { name: data.name } });
    if (existing) {
      console.log(`  · Counter exists: ${data.name}`);
      continue;
    }
    await prisma.counter.create({ data });
    console.log(`  ✓ Counter created: ${data.name}`);
  }
}

async function main() {
  console.log("Seeding database…");
  await seedSysadmin();
  await seedCounters();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
