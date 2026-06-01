import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/local-audit";
import { requireRoles } from "@/lib/auth-helper";

const classUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  academicYear: z.string().min(1).optional(),
  capacity: z.number().positive().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  classTeacherId: z.string().optional().nullable(),
});

const CLASS_MODIFY_ROLES = ["super_admin", "school_admin"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(CLASS_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;
    const { id } = await params;

    const classData = await prisma.class.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
        classTeacher: { select: { id: true, name: true, email: true } },
        enrollments: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          },
          where: { status: "active" },
        },
        subjects: { select: { id: true, name: true, code: true } },
        _count: { select: { enrollments: true, subjects: true, attendance: true } },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({ class: classData });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(CLASS_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;
    const { id } = await params;

    const existing = await prisma.class.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = classUpdateSchema.parse(body);

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.academicYear !== undefined ? { academicYear: data.academicYear } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.teacherId !== undefined ? { teacherId: data.teacherId } : {}),
        ...(data.classTeacherId !== undefined ? { classTeacherId: data.classTeacherId } : {}),
      },
    });

    audit.updated("class", id, user.id, user.schoolId ?? undefined);

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(CLASS_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;
    const { id } = await params;

    const existing = await prisma.class.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    await prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    audit.deleted("class", id, user.id, user.schoolId ?? undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
