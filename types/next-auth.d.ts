import type { Role } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

// Extend the NextAuth session/user/JWT with our application fields (id + role).
// Type-only augmentation: safe to import in the edge runtime.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
