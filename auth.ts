import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Full config: runs on the Node runtime (API route handler), so it can use the
// Prisma adapter and bcrypt. Spreads the edge-safe `authConfig` and overrides
// the Credentials provider with the real password-validation logic.
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Anti brute force / credential stuffing: limita i tentativi per
        // IP+email. Oltre il limite si rifiuta come una credenziale errata
        // (la pagina di sign-in di default di NextAuth non distingue il
        // motivo); l'obiettivo qui è bloccare l'attacco, non l'UX del messaggio.
        const ip = getClientIp(request.headers);
        const { success } = await checkRateLimit("login", `${ip}:${email}`);
        if (!success) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
