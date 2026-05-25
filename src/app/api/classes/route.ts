import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  code: z.string().min(1, "Class code is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  capacity: z.number().int().positive().optional().nullable(),
  teacherId: z.string().optional().nullable(),
});

const CLASS_MODIFY_ROLES = ["super_admin", "school_admin"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(CLASS_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const academicYear = searchParams.get("academicYear") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    if (academicYear) where.academicYear = academicYear;
    if (user.schoolId) where.schoolId = user.schoolId;

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNo: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: [{ academicYear: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.class.count({ where }),
    ]);

    return NextResponse.json({
      classes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(CLASS_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = classSchema.parse(body);

    const classRecord = await prisma.class.create({
      data: {
        name: data.name,
        code: data.code,
        academicYear: data.academicYear,
        capacity: data.capacity,
        ...(data.teacherId ? { teacherId: data.teacherId } : {}),
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
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

    return NextResponse.json({ class: classRecord }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
