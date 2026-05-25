import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifySync } from "otplib";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/local-rate-limit";
import { requireAuth } from "@/lib/auth-helper";

export async function POST(req: Request) {
  try {
    // Rate limit: 5 attempts per 5 minutes per IP
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`mfa-verify:${ip}`, 5, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000) },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)) } }
      );
    }

    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { code } = await req.json();
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaSecret: true },
    });

    if (!dbUser || !dbUser.mfaSecret) {
      return NextResponse.json({ error: "MFA not set up for this account" }, { status: 400 });
    }

    const isValid = verifySync({ token: code, secret: dbUser.mfaSecret });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Update session in database to mark as MFA verified
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("authjs.session-token")?.value ||
      cookieStore.get("__Secure-authjs.session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (sessionToken) {
      await prisma.session.update({
        where: { sessionToken },
        data: { mfaVerified: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MFA Verification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
