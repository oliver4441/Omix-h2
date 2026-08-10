import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_AZURE_AD_CLIENT_ID && process.env.AUTH_AZURE_AD_CLIENT_SECRET
      ? [
          AzureAD({
            clientId: process.env.AUTH_AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AUTH_AZURE_AD_CLIENT_SECRET,
            issuer: `https://login.microsoftonline.com/${process.env.AUTH_AZURE_AD_TENANT_ID}/v2.0`,
          }),
        ]
      : []),
    ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM
      ? [
          Nodemailer({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        schoolSlug: { label: "School", type: "hidden" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const schoolSlug = credentials.schoolSlug as string | undefined;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { school: true },
        });

        if (!user) return null;

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account is temporarily locked. Please try again later.");
        }

        const isSuperAdmin = user.role === "super_admin";

        // Non-super-admin users must belong to an active, approved school
        if (!isSuperAdmin) {
          if (!user.school || !user.school.isActive || !user.school.isApproved) {
            return null;
          }
          if (schoolSlug && user.school.slug !== schoolSlug) {
            return null;
          }
        }

        const passwordMatch = user.password ? await bcrypt.compare(password, user.password) : false;
        
        if (!passwordMatch) {
          // Increment failed login count
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: { increment: 1 },
              lockedUntil: user.failedLoginCount >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
            },
          });
          return null;
        }

        // Reset failed login count on success
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: 0, lockedUntil: null },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          schoolId: user.schoolId,
          schoolName: user.school?.name ?? null,
          schoolSlug: user.school?.slug ?? null,
          mfaEnabled: user.mfaEnabled,
          departmentId: user.departmentId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.schoolId = (user as any).schoolId ?? null;
        token.schoolName = (user as any).schoolName ?? null;
        token.schoolSlug = (user as any).schoolSlug ?? null;
        token.mfaEnabled = (user as any).mfaEnabled ?? false;
        token.departmentId = (user as any).departmentId ?? null;
        
        if (account?.provider === "credentials" && token.mfaEnabled) {
          token.mfaRequired = true;
          token.mfaVerified = false;
        } else {
          token.mfaRequired = false;
          token.mfaVerified = true;
        }
      }
      return token;
    },
    async session({ session, user, token }) {
      if (session.user) {
        // Database strategy: `user` is the User row and `session` carries the raw Session row
        // (including the mfaRequired/mfaVerified columns). JWT strategy: `token` carries the
        // custom claims set in the jwt callback above.
        const u = (user || token) as any;
        const rawSession = session as any;

        (session.user as any).id = u.id;
        (session.user as any).role = u.role;
        (session.user as any).schoolId = u.schoolId ?? null;
        (session.user as any).departmentId = u.departmentId ?? null;
        (session.user as any).schoolName = u.schoolName ?? null;
        (session.user as any).schoolSlug = u.schoolSlug ?? null;

        // MFA state. The User row knows whether MFA is enabled; the Session row tracks
        // whether this session has completed verification.
        const mfaEnabled = !!u.mfaEnabled;
        const mfaVerified =
          rawSession.mfaVerified ??
          (user ? !mfaEnabled : !!u.mfaVerified);
        (session.user as any).mfaRequired = mfaEnabled;
        (session.user as any).mfaVerified = mfaVerified;

        // The User row (database strategy) does not carry the school name/slug — fetch it
        // once so the UI and MFA setup can show it. Skipped for JWT strategy where the
        // jwt callback already populated these fields on the token.
        if (u.schoolId && !u.schoolName) {
          try {
            const school = await prisma.school.findUnique({
              where: { id: u.schoolId },
              select: { name: true, slug: true },
            });
            if (school) {
              (session.user as any).schoolName = school.name;
              (session.user as any).schoolSlug = school.slug;
            }
          } catch (error) {
            console.error("Failed to load school for session:", error);
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
});
