import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Next.js 16 renamed Middleware to Proxy. This runs on the edge, so it uses a
// NextAuth instance built from the edge-safe `authConfig` (no Prisma/bcrypt).
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");

  // Redirect unauthenticated users hitting /admin/* to NextAuth's default
  // sign-in page, preserving where they were headed.
  if (isOnAdmin && !isLoggedIn) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
