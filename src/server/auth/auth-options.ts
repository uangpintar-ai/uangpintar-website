import type { DefaultSession, NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "@/server/db";

export type JwtClaims = {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
};

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      userId?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      status?: string;
      accessToken?: string;
    } & DefaultSession["user"];
  }

  interface User extends JwtClaims {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends JwtClaims {
    accessToken?: string;
  }
}

async function generateToken(claims: JwtClaims): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("9d")
    .sign(secret);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isRetoken: { label: "Is Re-token", type: "text" },
      },
      async authorize(credentials) {
        try {
          const email = (credentials?.email as string) || "";
          const password = (credentials?.password as string) || "";
          const isRetoken = (credentials?.isRetoken as string) || "";

          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user?.password) return null;

          if (!isRetoken) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return null;
          }

          const claims: JwtClaims = {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
          };

          const token = await generateToken(claims);

          return {
            userId: claims.userId,
            firstName: claims.firstName,
            lastName: claims.lastName,
            role: claims.role,
            accessToken: token,
            email: user.email,
            status: user.status,
            id: claims.userId,
          } as User;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const username = (credentials?.username as string) || "";
          const password = (credentials?.password as string) || "";

          const admin = await db.admin.findUnique({
            where: { username },
          });

          if (!admin) return null;

          const isValid = await bcrypt.compare(password, admin.password);
          if (!isValid) return null;

          const claims: JwtClaims = {
            userId: admin.id,
            firstName: admin.username,
            role: "ADMIN",
          };

          const token = await generateToken(claims);

          return {
            userId: claims.userId,
            firstName: claims.firstName,
            role: claims.role,
            accessToken: token,
            id: claims.userId,
          } as User;
        } catch (error) {
          console.error("Admin authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/app/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.userId = user.userId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.email = user.email;
        token.status = user.status;
      }

      if (trigger === "update" && token.userId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId },
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        });

        if (dbUser) {
          token.email = dbUser.email;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.accessToken = token.accessToken;
      session.user.userId = token.userId;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.email = token.email;
      session.user.status = token.status;
      session.user.role = token.role;

      return session;
    },
  },
} satisfies NextAuthOptions;
