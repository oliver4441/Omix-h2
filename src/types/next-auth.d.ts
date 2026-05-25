// Types for NextAuth
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string;
    schoolId?: string | null;
    schoolName?: string | null;
    schoolSlug?: string | null;
    mfaEnabled?: boolean;
    mfaRequired?: boolean;
    mfaVerified?: boolean;
    departmentId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      schoolId: string | null;
      schoolName: string | null;
      schoolSlug: string | null;
      mfaRequired: boolean;
      mfaVerified: boolean;
      departmentId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string;
    id?: string;
    schoolId?: string | null;
    schoolName?: string | null;
    schoolSlug?: string | null;
    mfaEnabled?: boolean;
    mfaRequired?: boolean;
    mfaVerified?: boolean;
    departmentId?: string | null;
  }
}
