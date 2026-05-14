import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/api/auth"];

function getSubdomain(host: string | null): string | null {
  if (!host) return null;
  // Match *.onrender.com or *.localhost or custom domain patterns
  const parts = host.split(".");
  // onrender.com or render.com: first part is subdomain if there are 3+ parts
  // e.g., st-marys.omix-h2.onrender.com -> subdomain = "st-marys"
  if (parts.length >= 3 && (host.includes("onrender") || host.includes("render"))) {
    return parts[0];
  }
  // localhost: host like "st-marys.localhost:3000"
  if (host.includes("localhost") && parts.length >= 3) {
    return parts[0];
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public API paths and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Extract subdomain
  const host = req.headers.get("host");
  const subdomain = getSubdomain(host);

  // Set school cookie if subdomain detected
  const response = NextResponse.next();
  if (subdomain && subdomain !== "www" && subdomain !== "admin") {
    response.cookies.set("x-school-slug", subdomain, {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
    });
  } else if (!subdomain || subdomain === "www") {
    response.cookies.set("x-school-slug", "", { path: "/", maxAge: 0 });
  }

  // Allow public paths
  if (pathname === "/login" || pathname === "/register") {
    return response;
  }

  // Check authentication
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and on root, redirect to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
