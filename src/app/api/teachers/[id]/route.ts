import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;
    const { id } = await params;

    const teacher = await prisma.teacher.findUnique({
      where: { id, ...(schoolId ? { schoolId } : {}) },
      include: {
        classes: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
        subjects: true,
        _count: {
          select: { classes: true, subjects: true },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;
    const { id } = await params;
    const body = await request.json();
    const data = teacherUpdateSchema.parse(body);

    const existing = await prisma.teacher.findUnique({
      where: { id, ...(schoolId ? { schoolId } : {}) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const teacher = await prisma.teacher.update({
      where: { id, ...(schoolId ? { schoolId } : {}) },
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
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating teacher:", error);
    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;
    const { id } = await params;

    const existing = await prisma.teacher.findUnique({
      where: { id, ...(schoolId ? { schoolId } : {}) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    await prisma.teacher.delete({ where: { id } });

    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    );
  }
}
