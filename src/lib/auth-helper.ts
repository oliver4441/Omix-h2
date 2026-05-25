import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

export interface AuthUser {
  id: string;
  role: string;
  schoolId: string | null;
  schoolName: string | null;
  schoolSlug: string | null;
  mfaRequired: boolean;
  mfaVerified: boolean;
  departmentId: string | null;
  email: string;
  name: string;
}

export interface AuthResult {
  user: AuthUser;
  session: Session;
}

/**
 * Require authentication. Returns the typed user and session, or a NextResponse error.
 */
export async function requireAuth(): Promise<AuthResult | Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = session.user as AuthUser;
  return { user, session };
}

/**
 * Require specific roles. Returns the typed user and session, or a NextResponse error.
 */
export async function requireRoles(allowedRoles: string[]): Promise<AuthResult | Response> {
  const result = await requireAuth();
  if (result instanceof Response) return result;

  const { user } = result;
  if (!allowedRoles.includes(user.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return result;
}

/**
 * Get client IP from request headers (works behind proxies)
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE)))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri;
  return "unknown";
}
