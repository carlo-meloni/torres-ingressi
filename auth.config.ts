import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { Role } from "@/generated/prisma/enums";

// Edge-compatible auth config used by `proxy.ts`.
//
// IMPORTANT: this file must NOT import the Prisma adapter, bcrypt, or anything
// that depends on the Node runtime — the proxy runs on the edge. The real
// Credentials `authorize` logic lives in `auth.ts` (Node runtime), which spreads
// this config and overrides the providers below.
export const authConfig = {
  providers: [
    Credentials({
      // Placeholder. Overridden in `auth.ts` with bcrypt validation.
      authorize: () => null,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Persist id + role on the token at sign-in.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    // Expose id + role on the session for client/server consumers.
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
