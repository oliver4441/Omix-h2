import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const classUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  academicYear: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional().nullable(),
  teacherId: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = (session.user as any).schoolId;
    const { id } = await params;

    const classRecord = await prisma.class.findFirst({
      where: { id, ...(schoolId ? { schoolId } : {}) },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNo: true,
            email: true,
            phone: true,
            specialization: true,
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                admissionNo: true,
                firstName: true,
                lastName: true,
                gender: true,
                status: true,
              },
            },
          },
          orderBy: { date: "desc" },
        },
        subjects: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
        timetable: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        _count: {
          select: { enrollments: true, subjects: true, timetable: true },
        },
      },
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: classRecord });
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = (session.user as any).schoolId;
    const { id } = await params;
    const body = await request.json();
    const data = classUpdateSchema.parse(body);

    const existing = await prisma.class.findFirst({ where: { id, ...(schoolId ? { schoolId } : {}) } });
    if (!existing) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    const classRecord = await prisma.class.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.academicYear !== undefined && { academicYear: data.academicYear }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.teacherId === undefined
          ? {}
          : data.teacherId
          ? { teacherId: data.teacherId }
          : { teacher: { disconnect: true } }),
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ class: classRecord });
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = (session.user as any).schoolId;
    const { id } = await params;

    const existing = await prisma.class.findFirst({ where: { id, ...(schoolId ? { schoolId } : {}) } });
    if (!existing) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Delete related records first to avoid foreign key constraints
    await prisma.$transaction([
      prisma.enrollment.deleteMany({ where: { classId: id } }),
      prisma.timetable.deleteMany({ where: { classId: id } }),
      prisma.subject.updateMany({ where: { classId: id }, data: { classId: null } }),
      prisma.class.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
