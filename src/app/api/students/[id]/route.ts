import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/local-audit";
import { requireRoles } from "@/lib/auth-helper";

const STUDENT_MODIFY_ROLES = ["super_admin", "school_admin"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(STUDENT_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}), deletedAt: null },
      include: {
        enrollments: { include: { class: true }, orderBy: { date: "desc" } },
        _count: { select: { attendance: true, grades: true, feePayments: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(STUDENT_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.student.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}), deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "firstName", "lastName", "gender", "dateOfBirth", "address",
      "phone", "email", "guardianName", "guardianPhone", "guardianEmail", "status",
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const student = await prisma.student.update({ where: { id }, data: updateData });

    audit.updated("student", id, user.id, user.schoolId ?? undefined);

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(STUDENT_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const existing = await prisma.student.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}), deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), status: "inactive" },
    });

    audit.deleted("student", id, user.id, user.schoolId ?? undefined);

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
