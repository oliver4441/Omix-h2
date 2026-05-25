import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";

const updateApparatusSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  totalQuantity: z.number().int().positive().optional(),
  description: z.string().optional(),
});

const LAB_MODIFY_ROLES = ["super_admin", "school_admin", "lab_technician"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(LAB_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const data = updateApparatusSchema.parse(body);

    const existing = await prisma.scienceApparatus.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    });
    if (!existing) return NextResponse.json({ error: "Apparatus not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;

    if (data.totalQuantity !== undefined) {
      const diff = data.totalQuantity - existing.totalQuantity;
      updateData.totalQuantity = data.totalQuantity;
      updateData.available = existing.available + diff;
      if ((updateData.available as number) < 0) {
        return NextResponse.json({ error: "Total quantity cannot be less than currently checked out items" }, { status: 400 });
      }
    }

    const apparatus = await prisma.scienceApparatus.update({ where: { id }, data: updateData });
    return NextResponse.json({ apparatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating apparatus:", error);
    return NextResponse.json({ error: "Failed to update apparatus" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(LAB_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const existing = await prisma.scienceApparatus.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    });
    if (!existing) return NextResponse.json({ error: "Apparatus not found" }, { status: 404 });

    await prisma.scienceApparatus.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting apparatus:", error);
    return NextResponse.json({ error: "Failed to delete apparatus" }, { status: 500 });
  }
}
