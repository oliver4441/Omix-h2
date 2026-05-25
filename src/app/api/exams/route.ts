import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles, parsePagination } from "@/lib/auth-helper";

const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  term: z.string().min(1, "Term is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional().nullable(),
});

const EXAM_MODIFY_ROLES = ["super_admin", "school_admin", "department_head"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(EXAM_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const academicYear = searchParams.get("academicYear") || "";
    const term = searchParams.get("term") || "";

    const where: Record<string, unknown> = {};

    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = term;
    if (user.schoolId) where.schoolId = user.schoolId;

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        include: {
          _count: {
            select: { grades: true },
          },
        },
        orderBy: [{ academicYear: "desc" }, { startDate: "desc" }],
        skip,
        take: limit,
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({
      exams,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(EXAM_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = examSchema.parse(body);

    const exam = await prisma.exam.create({
      data: {
        name: data.name,
        term: data.term,
        academicYear: data.academicYear,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating exam:", error);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}
