import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles, parsePagination } from "@/lib/auth-helper";
import { z } from "zod";

const performanceSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  examId: z.string().min(1, "Exam ID is required"),
  term: z.string().min(1, "Term is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  studentCount: z.number().int().optional().nullable(),
  meanScore: z.number().optional().nullable(),
  highestScore: z.number().optional().nullable(),
  lowestScore: z.number().optional().nullable(),
  passRate: z.number().optional().nullable(),
});

const PERFORMANCE_ROLES = ["super_admin", "school_admin", "department_head"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(PERFORMANCE_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const subjectId = searchParams.get("subjectId") || "";
    const classId = searchParams.get("classId") || "";
    const examId = searchParams.get("examId") || "";
    const term = searchParams.get("term") || "";
    const academicYear = searchParams.get("academicYear") || "";

    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (classId) where.classId = classId;
    if (examId) where.examId = examId;
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;
    if (user.schoolId) where.schoolId = user.schoolId;

    const [records, total] = await Promise.all([
      prisma.subjectPerformance.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, code: true } },
          exam: { select: { id: true, name: true, term: true, academicYear: true } },
          recordedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ academicYear: "desc" }, { term: "desc" }, { createdAt: "desc" }],
        skip, take: limit,
      }),
      prisma.subjectPerformance.count({ where }),
    ]);

    return NextResponse.json({ records, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching subject performance:", error);
    return NextResponse.json({ error: "Failed to fetch subject performance records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(PERFORMANCE_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = performanceSchema.parse(body);

    const record = await prisma.subjectPerformance.upsert({
      where: { subjectId_classId_examId: { subjectId: data.subjectId, classId: data.classId, examId: data.examId } },
      update: {
        term: data.term, academicYear: data.academicYear,
        studentCount: data.studentCount ?? null, meanScore: data.meanScore ?? null,
        highestScore: data.highestScore ?? null, lowestScore: data.lowestScore ?? null,
        passRate: data.passRate ?? null, recordedById: user.id,
      },
      create: {
        subjectId: data.subjectId, classId: data.classId, examId: data.examId,
        term: data.term, academicYear: data.academicYear,
        studentCount: data.studentCount ?? null, meanScore: data.meanScore ?? null,
        highestScore: data.highestScore ?? null, lowestScore: data.lowestScore ?? null,
        passRate: data.passRate ?? null, recordedById: user.id,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
        exam: { select: { id: true, name: true, term: true, academicYear: true } },
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating/updating subject performance:", error);
    return NextResponse.json({ error: "Failed to save subject performance record" }, { status: 500 });
  }
}
