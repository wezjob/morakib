import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";

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
        // Demo mode - accept any login with valid email format
        if (process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true") {
          const email = credentials?.email as string;
          if (email && email.includes("@")) {
            // Check if user exists or create demo user
            let user = await db.user.findUnique({ where: { email } });
            
            if (!user) {
              user = await db.user.create({
                data: {
                  email,
                  name: email.split("@")[0],
                  role: "ANALYST_JUNIOR",
                },
              });
            }
            
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.avatarUrl,
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
        // Fetch role from database
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, teamId: true },
        });
        token.role = dbUser?.role || "ANALYST_JUNIOR";
        token.teamId = dbUser?.teamId ?? undefined;
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
