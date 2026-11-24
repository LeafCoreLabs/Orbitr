import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "./db";
import { users, sessionsDevices, activityLog, passkeyChallenges } from "./db/schema";
import { eq, or, and, gt } from "drizzle-orm";
import { verify, hash } from "@node-rs/argon2";
import { createAndSendOtp } from "./otp";
import { mailer } from "./mailer";
import { headers } from "next/headers";
import crypto from "crypto";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "orbitr-auth-secret-min-32-chars-long-development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/signout",
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID &&
    process.env.AUTH_GOOGLE_SECRET &&
    !process.env.AUTH_GOOGLE_ID.includes("placeholder")
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email or User ID", type: "text" },
        password: { label: "Password", type: "password" },
        passkeyToken: { label: "Passkey Token", type: "text" },
      },
      async authorize(credentials) {
        // --- Flow A: Passkey (FIDO2 / WebAuthn) Authentication ---
        if (credentials?.passkeyToken) {
          const token = (credentials.passkeyToken as string).trim();
          const challengeRecords = await db
            .select()
            .from(passkeyChallenges)
            .where(
              and(
                eq(passkeyChallenges.id, token),
                gt(passkeyChallenges.expiresAt, new Date())
              )
            )
            .limit(1);

          if (challengeRecords.length === 0 || !challengeRecords[0].userId) {
            return null;
          }

          const userRecord = await db
            .select()
            .from(users)
            .where(eq(users.id, challengeRecords[0].userId))
            .limit(1);

          if (userRecord.length === 0) {
            return null;
          }

          // Invalidate challenge token
          await db
            .delete(passkeyChallenges)
            .where(eq(passkeyChallenges.id, token));

          const u = userRecord[0];

          // Audit log passkey sign-in
          try {
            const h = await headers();
            const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Unknown IP";
            const userAgent = h.get("user-agent") || "Web Browser";

            await db.insert(activityLog).values({
              id: crypto.randomUUID(),
              userId: u.id,
              action: "login_passkey",
              ip,
              userAgent,
              createdAt: new Date(),
            });
          } catch (e) {
            console.error("[Auth] Passkey audit log error:", e);
          }

          return {
            id: u.id,
            email: u.email,
            name: u.name,
          };
        }

        // --- Flow B: Standard Password Authentication (Email or User ID) ---
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const identifier = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        // Fetch user from DB by email OR handle (User ID)
        const userList = await db
          .select()
          .from(users)
          .where(or(eq(users.email, identifier), eq(users.handle, identifier)))
          .limit(1);

        if (userList.length === 0) {
          return null;
        }

        const user = userList[0];

        if (!user.passwordHash) {
          return null;
        }

        // Verify argon2id hash
        const isPasswordValid = await verify(user.passwordHash, password);
        if (!isPasswordValid) {
          return null;
        }

        // Check email verification status
        if (!user.emailVerifiedAt) {
          let ip = "Unknown IP";
          let userAgent = "Web Browser";
          try {
            const h = await headers();
            ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Unknown IP";
            userAgent = h.get("user-agent") || "Web Browser";
          } catch {
            // ignore headers error if running outside request scope
          }

          await createAndSendOtp({
            email: user.email,
            userId: user.id,
            purpose: "signup",
            ip,
            userAgent,
          });

          throw new Error("UNVERIFIED_EMAIL");
        }

        // Audit device and activity log
        try {
          const h = await headers();
          const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Unknown IP";
          const userAgent = h.get("user-agent") || "Web Browser";

          await db.insert(sessionsDevices).values({
            id: crypto.randomUUID(),
            userId: user.id,
            deviceLabel: userAgent.slice(0, 80),
            ip,
            lastSeenAt: new Date(),
          });

          await db.insert(activityLog).values({
            id: crypto.randomUUID(),
            userId: user.id,
            action: "login",
            ip,
            userAgent,
            createdAt: new Date(),
          });
        } catch (e) {
          console.error("[Auth] Could not log session/activity:", e);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const email = user.email.trim().toLowerCase();

        try {
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existing.length === 0) {
            // New user signing up with Google OAuth:
            // Generate a secure account password so they can log in via credentials too!
            const generatedPassword = `Orbitr-${crypto.randomBytes(4).toString("hex").toUpperCase()}!`;
            const passwordHash = await hash(generatedPassword);
            const rawHandle = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "");
            const handle = (rawHandle + "_" + crypto.randomInt(100, 999)).slice(0, 30);
            const newUserId = user.id || crypto.randomUUID();
            user.id = newUserId;

            await db.insert(users).values({
              id: newUserId,
              email,
              handle,
              name: user.name || "Orbitr User",
              passwordHash,
              emailVerifiedAt: new Date(), // Pre-verified by Google
              quotaBytes: 2147483648, // 2 GB
              usedBytes: 0,
              createdAt: new Date(),
            });

            // Dispatch welcome credentials email containing user id & password
            await mailer.sendAccountCredentials(email, {
              name: user.name || "Orbitr User",
              userId: handle,
              email,
              password: generatedPassword,
              signupMethod: "google",
            });
          } else {
            user.id = existing[0].id;
            // If previously created as unverified via credentials, Google sign-in verifies it!
            if (!existing[0].emailVerifiedAt) {
              await db
                .update(users)
                .set({ emailVerifiedAt: new Date() })
                .where(eq(users.id, existing[0].id));
            }
          }
        } catch (err) {
          console.error("[Auth] Error provisioning Google user:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
