import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";

const DEMO_LOGIN_EMAIL = process.env.MORAKIB_LOGIN_EMAIL || "admin@morakib.local";
const DEMO_LOGIN_PASSWORD = process.env.MORAKIB_LOGIN_PASSWORD || "Morakib@2026!";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Using JWT strategy (no adapter needed)
  providers: [
    // Keycloak SSO (for SOC-in-a-Box integration)
    Keycloak({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
    // Credentials for development/demo mode
    Credentials({
      name: "Demo Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "analyst@morakib.local" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Demo mode - accept only configured fallback credentials.
        if (process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true") {
          const email = credentials?.email as string;
          const password = credentials?.password as string;

          if (email === DEMO_LOGIN_EMAIL && password === DEMO_LOGIN_PASSWORD) {
            return {
              id: `demo-${DEMO_LOGIN_EMAIL}`,
              email: DEMO_LOGIN_EMAIL,
              name: "Admin Morakib",
              image: null,
              role: "ADMIN",
            };
          }
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        const userRole = (user as { role?: string }).role;
        if (userRole) {
          token.role = userRole;
        }

        // Fetch role from database when available, but do not block login if DB is down.
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { role: true, teamId: true },
          });
          token.role = dbUser?.role || token.role || "ANALYST_JUNIOR";
          token.teamId = dbUser?.teamId ?? undefined;
        } catch {
          token.role = token.role || "ADMIN";
        }
      }
      // Store Keycloak tokens for logout
      if (account?.provider === "keycloak") {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.teamId = token.teamId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
});
