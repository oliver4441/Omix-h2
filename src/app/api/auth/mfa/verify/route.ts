import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifySync } from "otplib";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { mfaSecret: true },
    });

    if (!user || !user.mfaSecret) {
      return NextResponse.json({ error: "MFA not set up for this account" }, { status: 400 });
    }

    // Verify TOTP code
    const isValid = verifySync({
      token: code,
      secret: user.mfaSecret,
    });
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Update session in database to mark as MFA verified
    const cookieStore = await cookies();
    // NextAuth v5 uses these cookie names by default
    const sessionToken = cookieStore.get("authjs.session-token")?.value || 
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
