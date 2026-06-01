import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/local-audit";
import { requireRoles, parsePagination } from "@/lib/auth-helper";

const attendanceRecordSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "late", "excused"]),
  remarks: z.string().optional().nullable(),
});

const bulkAttendanceSchema = z.array(attendanceRecordSchema);

const ATTENDANCE_ROLES = ["super_admin", "school_admin", "teacher", "department_head", "class_teacher"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(ATTENDANCE_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const classId = searchParams.get("classId") || "";
    const date = searchParams.get("date") || "";
    const status = searchParams.get("status") || "";
    const studentId = searchParams.get("studentId") || "";

    const where: any = {};
    if (user.schoolId) where.schoolId = user.schoolId;
    if (classId) where.classId = classId;
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (date) {
      const parsed = new Date(date);
      const nextDay = new Date(parsed);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: parsed, lt: nextDay };
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          class: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ date: "desc" }, { student: { firstName: "asc" } }],
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      attendance,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(ATTENDANCE_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const records = bulkAttendanceSchema.parse(body);

    const results = await Promise.all(
      records.map((record) =>
        prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: record.studentId,
              classId: record.classId,
              date: new Date(record.date),
            },
          },
          update: {
            status: record.status,
            remarks: record.remarks ?? null,
          },
          create: {
            studentId: record.studentId,
            classId: record.classId,
            date: new Date(record.date),
            status: record.status,
            remarks: record.remarks ?? null,
            ...(user.schoolId ? { schoolId: user.schoolId } : {}),
          },
        })
      )
    );

    audit.created("attendance", "bulk", user.id, user.schoolId ?? undefined, {
      count: results.length,
    });

    return NextResponse.json({ attendance: results, count: results.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating attendance records:", error);
    return NextResponse.json(
      { error: "Failed to create attendance records" },
      { status: 500 }
    );
  }
}
