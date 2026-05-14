import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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

        // Super admin doesn't need school scoping
        if (user.role === "super_admin") {
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            schoolId: null,
          };
        }

        // Non-super-admin users must belong to an active, approved school
        if (!user.school || !user.school.isActive || !user.school.isApproved) {
          return null;
        }

        // If schoolSlug provided, verify user belongs to that school
        if (schoolSlug && user.school.slug !== schoolSlug) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          schoolId: user.schoolId,
          schoolName: user.school.name,
          schoolSlug: user.school.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.schoolId = (user as any).schoolId ?? null;
        token.schoolName = (user as any).schoolName ?? null;
        token.schoolSlug = (user as any).schoolSlug ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).schoolName = token.schoolName;
        (session.user as any).schoolSlug = token.schoolSlug;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
