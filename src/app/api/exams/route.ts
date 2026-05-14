import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  term: z.string().min(1, "Term is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear") || "";
    const term = searchParams.get("term") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = term;
    if (schoolId) where.schoolId = schoolId;

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;
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
        ...(schoolId ? { schoolId } : {}),
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
