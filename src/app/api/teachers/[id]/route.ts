import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-helper";
import { z } from "zod";

const teacherUpdateSchema = z.object({
  employeeNo: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  qualification: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

const TEACHER_MODIFY_ROLES = ["super_admin", "school_admin"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(TEACHER_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const teacher = await prisma.teacher.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}), deletedAt: null },
      include: {
        classes: { include: { _count: { select: { enrollments: true } } } },
        subjects: true,
        _count: { select: { classes: true, subjects: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(TEACHER_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const data = teacherUpdateSchema.parse(body);

    const existing = await prisma.teacher.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}), deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...(data.employeeNo !== undefined && { employeeNo: data.employeeNo }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.qualification !== undefined && { qualification: data.qualification }),
        ...(data.specialization !== undefined && { specialization: data.specialization }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return NextResponse.json({ teacher });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating teacher:", error);
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(TEACHER_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const existing = await prisma.teacher.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}), deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date(), status: "inactive" },
    });

    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
