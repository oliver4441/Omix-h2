import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateSecret, generateURI } from "otplib";
import qrcode from "qrcode";
import { requireAuth } from "@/lib/auth-helper";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isFirstSetup = !dbUser.mfaSecret;
    let secret = dbUser.mfaSecret;
    if (!secret) {
      secret = generateSecret();
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaSecret: secret },
      });
    }

    const schoolName = user.schoolName || "omixsystems";
    const otpauth = generateURI({
      issuer: `omix-sms (${schoolName})`,
      label: dbUser.email,
      secret,
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({
      secret: isFirstSetup ? secret : undefined,
      qrCodeDataUrl,
      mfaEnabled: dbUser.mfaEnabled,
    });
  } catch (error) {
    console.error("MFA Setup Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
