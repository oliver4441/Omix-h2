import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateSecret, generateURI } from "otplib";
import qrcode from "qrcode";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let secret = user.mfaSecret;
    if (!secret) {
      secret = generateSecret();
      await prisma.user.update({
        where: { id: userId },
        data: { mfaSecret: secret },
      });
    }

    const schoolName = (session.user as any).schoolName || "omixsystems";
    const otpauth = generateURI({
      issuer: `omix-sms (${schoolName})`,
      label: user.email,
      secret,
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({
      secret,
      qrCodeDataUrl,
    });
  } catch (error) {
    console.error("MFA Setup Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
