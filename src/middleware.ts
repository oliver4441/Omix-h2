import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/api/auth"];

function getSubdomain(host: string | null): string | null {
  if (!host) return null;
  const parts = host.split(".");

  // Render deployment: school-name.onrender.com (3 parts, has "render")
  if (parts.length >= 3 && (host.includes("onrender") || host.includes("render"))) {
    if (parts.length >= 4) return parts[0];
    return null;
  }

  // Localhost with subdomain: school.localhost:3000
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    if (parts.length >= 3) return parts[0];
    return null;
  }

  // Production custom domain: school.omixsystems.com (3+ parts)
  // Skip www and common subdomains that aren't school slugs
  const reservedSubdomains = ["www", "admin", "api", "staging", "dev", "test", "mail", "ftp"];
  if (parts.length >= 3) {
    const candidate = parts[0];
    if (!reservedSubdomains.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;

  // Force HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

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

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest|icon|apple-touch-icon|favicon|service-worker|sw|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|json|webmanifest)).*)"],
};
