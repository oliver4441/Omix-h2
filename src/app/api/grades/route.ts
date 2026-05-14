import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const gradeRecordSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  examId: z.string().min(1, "Exam ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  score: z.number().min(0).optional().nullable(),
  grade: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const batchGradeSchema = z.array(gradeRecordSchema);

export async function authGuard(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return (session.user as any).schoolId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId") || "";
    const classId = searchParams.get("classId") || "";
    const studentId = searchParams.get("studentId") || "";
    const subjectId = searchParams.get("subjectId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "200");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (examId) where.examId = examId;
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (schoolId) where.schoolId = schoolId;

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              lastName: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          exam: {
            select: {
              id: true,
              name: true,
              term: true,
              academicYear: true,
            },
          },
        },
        orderBy: [
          { exam: { academicYear: "desc" } },
          { student: { firstName: "asc" } },
        ],
        skip,
        take: limit,
      }),
      prisma.grade.count({ where }),
    ]);

    return NextResponse.json({
      grades,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const records = batchGradeSchema.parse(body);

    const results = await Promise.all(
      records.map(async (record) => {
        return prisma.grade.upsert({
          where: {
            studentId_subjectId_examId: {
              studentId: record.studentId,
              subjectId: record.subjectId,
              examId: record.examId,
            },
          },
          update: {
            classId: record.classId,
            score: record.score ?? null,
            grade: record.grade ?? null,
            remarks: record.remarks ?? null,
          },
          create: {
            studentId: record.studentId,
            subjectId: record.subjectId,
            examId: record.examId,
            classId: record.classId,
            score: record.score ?? null,
            grade: record.grade ?? null,
            remarks: record.remarks ?? null,
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNo: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });
      })
    );

    return NextResponse.json({ grades: results, count: results.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating/updating grades:", error);
    return NextResponse.json(
      { error: "Failed to save grades" },
      { status: 500 }
    );
  }
}
