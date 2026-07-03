import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Providers are populated in auth.ts to avoid database/crypto edge runtime issues
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute = nextUrl.pathname === "/login";

      // Allow static assets, images, and API routes
      if (
        nextUrl.pathname.startsWith("/_next") ||
        nextUrl.pathname.startsWith("/api") ||
        nextUrl.pathname.includes(".")
      ) {
        return true;
      }

      if (isPublicRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
