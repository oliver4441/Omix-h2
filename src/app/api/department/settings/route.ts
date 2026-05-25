import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth-helper";

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, name: true, role: true, departmentId: true,
        department: { select: { id: true, name: true, slug: true, type: true } },
        schoolId: true,
        school: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();

    // Profile update — name and/or email
    if (body.name || body.email) {
      const updateData: Record<string, string> = {};
      if (body.name) updateData.name = body.name;
      if (body.email) updateData.email = body.email;

      if (body.email && body.email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email: body.email } });
        if (existing && existing.id !== user.id) {
          return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData });
      return NextResponse.json({ success: true, message: "Profile updated" });
    }

    // Password change
    const data = updatePasswordSchema.parse(body);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!dbUser.password) {
      return NextResponse.json(
        { error: "Accounts using social login do not have a password set. Please use your social provider to manage security." },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(data.currentPassword, dbUser.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating password:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
