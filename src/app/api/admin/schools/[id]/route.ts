import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-helper";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "activate", "deactivate"]).optional(),
  isApproved: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const SUPER_ADMIN_ONLY = ["super_admin"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRoles(SUPER_ADMIN_ONLY);
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await params;
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, students: true, teachers: true, classes: true, subjects: true, feeStructures: true, feePayments: true, announcements: true, exams: true } },
        users: { select: { id: true, name: true, email: true, role: true, image: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });
    return NextResponse.json({ school });
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRoles(SUPER_ADMIN_ONLY);
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = actionSchema.parse(body);

    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "School not found" }, { status: 404 });

    let updateData: Record<string, boolean> = {};
    if (parsed.action) {
      switch (parsed.action) {
        case "approve": updateData = { isApproved: true }; break;
        case "reject": updateData = { isApproved: false }; break;
        case "activate": updateData = { isActive: true, isApproved: true }; break;
        case "deactivate": updateData = { isActive: false }; break;
      }
    } else {
      if (parsed.isApproved !== undefined) updateData.isApproved = parsed.isApproved;
      if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive;
    }

    const school = await prisma.school.update({
      where: { id }, data: updateData,
      select: { id: true, name: true, slug: true, subdomain: true, isActive: true, isApproved: true, updatedAt: true },
    });

    return NextResponse.json({ message: "School updated successfully", school });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating school:", error);
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}
