import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-helper";

const STATS_ROLES = ["super_admin", "school_admin", "bursar", "teacher", "department_head", "librarian", "lab_technician", "computer_lab", "board_member"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(STATS_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const schoolId = user.schoolId;
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear") || new Date().getFullYear().toString();

    const studentWhere: any = { status: "active", deletedAt: null };
    const teacherWhere: any = { status: "active", deletedAt: null };
    const classWhere: any = { academicYear, deletedAt: null };
    const feePaymentWhere: Record<string, unknown> = {};
    const enrollmentWhere: Record<string, unknown> = {};

    if (schoolId) {
      studentWhere.schoolId = schoolId;
      teacherWhere.schoolId = schoolId;
      classWhere.schoolId = schoolId;
      feePaymentWhere.schoolId = schoolId;
      enrollmentWhere.schoolId = schoolId;
    }

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceStats,
      recentPayments,
      recentStudents,
      recentTeachers,
      recentClasses,
      recentEnrollments,
      enrollmentByClass,
      feeCollectionByMonth,
    ] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.teacher.count({ where: teacherWhere }),
      prisma.class.count({ where: classWhere }),
      prisma.attendance.groupBy({
        by: ["status"],
        _count: { id: true },
        where: schoolId ? { student: { schoolId } } : undefined,
      }),
      prisma.feePayment.findMany({
        where: Object.keys(feePaymentWhere).length > 0 ? feePaymentWhere : undefined,
        take: 5,
        orderBy: { paymentDate: "desc" },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
          feeStructure: { select: { name: true } },
        },
      }),
      prisma.student.findMany({
        where: schoolId ? { schoolId, deletedAt: null } : { deletedAt: null },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, firstName: true, lastName: true, admissionNo: true, createdAt: true },
      }),
      prisma.teacher.findMany({
        where: schoolId ? { schoolId, deletedAt: null } : { deletedAt: null },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, firstName: true, lastName: true, employeeNo: true, createdAt: true },
      }),
      prisma.class.findMany({
        where: schoolId ? { schoolId, ...classWhere } : classWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, code: true, createdAt: true },
      }),
      prisma.enrollment.findMany({
        where: schoolId ? { schoolId } : undefined,
        take: 5,
        orderBy: { date: "desc" },
        include: {
          student: { select: { firstName: true, lastName: true, admissionNo: true } },
          class: { select: { name: true, code: true } },
        },
      }),
      prisma.class.findMany({
        where: schoolId ? { schoolId, academicYear } : { academicYear },
        select: { id: true, name: true, code: true, _count: { select: { enrollments: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.feePayment.findMany({
        where: {
          ...(schoolId ? { schoolId } : {}),
          paymentDate: { gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1) },
        },
        select: { amount: true, paymentDate: true },
        orderBy: { paymentDate: "asc" },
      }),
    ]);

    let attendanceRate = 0;
    const totalAttendanceRecords = attendanceStats.reduce((sum: number, s: any) => sum + s._count.id, 0);
    if (totalAttendanceRecords > 0) {
      const presentCount = attendanceStats
        .filter((s: any) => s.status === "present" || s.status === "late")
        .reduce((sum: number, s: any) => sum + s._count.id, 0);
      attendanceRate = Math.round((presentCount / totalAttendanceRecords) * 100);
    }

    const recentActivity = [
      ...recentStudents.map((s: any) => ({
        type: "student_created" as const,
        description: `Student ${s.firstName} ${s.lastName} (${s.admissionNo}) was enrolled`,
        date: s.createdAt,
        id: s.id,
      })),
      ...recentTeachers.map((t: any) => ({
        type: "teacher_created" as const,
        description: `Teacher ${t.firstName} ${t.lastName} (${t.employeeNo}) was hired`,
        date: t.createdAt,
        id: t.id,
      })),
      ...recentClasses.map((c: any) => ({
        type: "class_created" as const,
        description: `Class ${c.name} (${c.code}) was created`,
        date: c.createdAt,
        id: c.id,
      })),
      ...recentEnrollments.map((e: any) => ({
        type: "enrollment_created" as const,
        description: `${e.student.firstName} ${e.student.lastName} enrolled in ${e.class.name}`,
        date: e.date,
        id: e.id,
      })),
      ...recentPayments.map((p: any) => ({
        type: "payment_received" as const,
        description: `Payment of $${p.amount.toFixed(2)} received from ${p.student.firstName} ${p.student.lastName}`,
        date: p.paymentDate,
        id: p.id,
      })),
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const feeMap = new Map<string, number>();
    feeCollectionByMonth.forEach((p: any) => {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      feeMap.set(key, (feeMap.get(key) || 0) + p.amount);
    });

    const feeCollectionByMonthFormatted = Array.from(feeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => {
        const [year, month] = key.split("-");
        return { month: monthNames[parseInt(month) - 1], year, total: Math.round(total * 100) / 100 };
      })
      .slice(-12);

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceRate,
      recentPayments: recentPayments.map((p: any) => ({
        id: p.id, amount: p.amount, method: p.method, term: p.term,
        academicYear: p.academicYear, paymentDate: p.paymentDate,
        student: p.student, feeStructure: p.feeStructure,
      })),
      recentActivity,
      studentEnrollmentByClass: enrollmentByClass.map((c: any) => ({
        id: c.id, name: c.name, code: c.code, studentCount: c._count.enrollments,
      })),
      feeCollectionByMonth: feeCollectionByMonthFormatted,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
