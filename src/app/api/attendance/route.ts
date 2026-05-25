import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles, parsePagination } from "@/lib/auth-helper";

const attendanceRecordSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "late", "excused"]),
  remarks: z.string().optional().nullable(),
});

const batchAttendanceSchema = z.array(attendanceRecordSchema);

const ATTENDANCE_ROLES = ["super_admin", "school_admin", "teacher", "department_head"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(ATTENDANCE_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const classId = searchParams.get("classId") || "";
    const date = searchParams.get("date") || "";
    const studentId = searchParams.get("studentId") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (date) {
      const filterDate = new Date(date);
      const nextDate = new Date(filterDate);
      nextDate.setDate(nextDate.getDate() + 1);
      where.date = { gte: filterDate, lt: nextDate };
    }
    if (user.schoolId) where.schoolId = user.schoolId;

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: { id: true, admissionNo: true, firstName: true, lastName: true, gender: true },
          },
          class: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: [{ date: "desc" }, { student: { firstName: "asc" } }],
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({ records, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(ATTENDANCE_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const records = batchAttendanceSchema.parse(body);

    const results = await Promise.all(
      records.map(async (record) => {
        const dateValue = new Date(record.date);
        return prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: record.studentId,
              classId: record.classId,
              date: dateValue,
            },
          },
          update: { status: record.status, remarks: record.remarks ?? null },
          create: {
            studentId: record.studentId,
            classId: record.classId,
            date: dateValue,
            status: record.status,
            remarks: record.remarks ?? null,
            ...(user.schoolId ? { schoolId: user.schoolId } : {}),
          },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, admissionNo: true },
            },
          },
        });
      })
    );

    return NextResponse.json({ records: results, count: results.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating/updating attendance records:", error);
    return NextResponse.json({ error: "Failed to save attendance records" }, { status: 500 });
  }
}
