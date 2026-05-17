import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/api/auth"];

function getSubdomain(host: string | null): string | null {
  if (!host) return null;
  const parts = host.split(".");
  if (parts.length >= 3 && (host.includes("onrender") || host.includes("render"))) {
    if (parts.length >= 4) return parts[0];
    return null;
  }
  if (host.includes("localhost") && parts.length >= 3) {
    return parts[0];
  }
  return null;
}

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname.startsWith("/service-worker") ||
    pathname.startsWith("/sw") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|json|webmanifest)$/)
  ) {
    return;
  }

  // Extract subdomain
  const host = req.headers.get("host");
  const subdomain = getSubdomain(host);

  // Set or clear school cookie
  const response = NextResponse.next();
  if (subdomain && subdomain !== "www" && subdomain !== "admin") {
    response.cookies.set("x-school-slug", subdomain, {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });
  } else if (!subdomain || subdomain === "www") {
    response.cookies.set("x-school-slug", "", { path: "/", maxAge: 0 });
  }

  // Allow public paths
  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/api/auth")) {
    return response;
  }

  // Check authentication
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // MFA Guard
  const mfaRequired = (req.auth?.user as any)?.mfaRequired;
  const mfaVerified = (req.auth?.user as any)?.mfaVerified;

  if (mfaRequired && !mfaVerified && pathname !== "/auth/mfa") {
    return NextResponse.redirect(new URL("/auth/mfa", req.url));
  }

  // If logged in and on root, redirect to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest|icon|apple-touch-icon|favicon|service-worker|sw|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|json|webmanifest)).*)"],
};
