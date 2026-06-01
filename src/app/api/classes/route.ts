import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/local-audit";
import { requireRoles, parsePagination } from "@/lib/auth-helper";

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  code: z.string().min(1, "Class code is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  capacity: z.number().positive().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  classTeacherId: z.string().optional().nullable(),
});

const CLASS_MODIFY_ROLES = ["super_admin", "school_admin"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(CLASS_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const academicYear = searchParams.get("academicYear") || "";
    const search = searchParams.get("search") || "";

    const where: any = { deletedAt: null };
    if (user.schoolId) where.schoolId = user.schoolId;
    if (academicYear) where.academicYear = academicYear;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true } },
          classTeacher: { select: { id: true, name: true } },
          _count: { select: { enrollments: true, subjects: true, attendance: true } },
        },
        orderBy: { name: "asc" },
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

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        code: data.code,
        academicYear: data.academicYear,
        capacity: data.capacity ?? null,
        teacherId: data.teacherId ?? null,
        classTeacherId: data.classTeacherId ?? null,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    audit.created("class", newClass.id, user.id, user.schoolId ?? undefined, {
      name: data.name,
      code: data.code,
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
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
