import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { user_email: String(credentials.email) },
              { user_phone: String(credentials.email) },
            ],
          },
          include: {
            role: true,
          },
        });

        if (!user || user.user_status !== 1) {
          return null;
        }

        // Compare password (laravel bcrypt uses standard bcrypt hash)
        const passwordMatches = await bcrypt.compare(
          String(credentials.password),
          user.user_password
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: String(user.user_id),
          name: user.user_name,
          email: user.user_email,
          role: user.role.role_name,
          roleId: user.user_role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.roleId = (user as any).roleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).roleId = token.roleId as number;
      }
      return session;
    },
  },
});
