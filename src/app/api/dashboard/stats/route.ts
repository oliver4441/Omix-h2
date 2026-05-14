import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear") || new Date().getFullYear().toString();

    // Base where clauses scoped by schoolId (null for super_admin means no filter)
    const studentWhere: any = { status: "active" };
    const teacherWhere: any = { status: "active" };
    const classWhere: any = { academicYear };
    const feePaymentWhere: any = {};
    const enrollmentWhere: any = {};

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
      // Total active students
      prisma.student.count({ where: studentWhere }),

      // Total active teachers
      prisma.teacher.count({ where: teacherWhere }),

      // Total classes for current academic year
      prisma.class.count({ where: classWhere }),

      // Attendance rate calculation
      prisma.attendance.groupBy({
        by: ["status"],
        _count: { id: true },
        where: schoolId ? { student: { schoolId } } : undefined,
      }),

      // Recent payments (last 5)
      prisma.feePayment.findMany({
        where: Object.keys(feePaymentWhere).length > 0 ? feePaymentWhere : undefined,
        take: 5,
        orderBy: { paymentDate: "desc" },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
            },
          },
          feeStructure: {
            select: { name: true },
          },
        },
      }),

      // Recent activity: students
      prisma.student.findMany({
        where: schoolId ? { schoolId } : undefined,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          createdAt: true,
        },
      }),

      // Recent activity: teachers
      prisma.teacher.findMany({
        where: schoolId ? { schoolId } : undefined,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
          createdAt: true,
        },
      }),

      // Recent activity: classes
      prisma.class.findMany({
        where: schoolId ? { schoolId, ...classWhere } : classWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
        },
      }),

      // Recent activity: enrollments
      prisma.enrollment.findMany({
        where: schoolId ? { schoolId } : undefined,
        take: 5,
        orderBy: { date: "desc" },
        include: {
          student: {
            select: { firstName: true, lastName: true, admissionNo: true },
          },
          class: {
            select: { name: true, code: true },
          },
        },
      }),

      // Student enrollment by class
      prisma.class.findMany({
        where: schoolId ? { schoolId, academicYear } : { academicYear },
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: { name: "asc" },
      }),

      // Fee collection by month (last 12 months)
      prisma.feePayment.findMany({
        where: {
          ...(schoolId ? { schoolId } : {}),
          paymentDate: {
            gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1),
          },
        },
        select: {
          amount: true,
          paymentDate: true,
        },
        orderBy: { paymentDate: "asc" },
      }),
    ]);

    // Calculate attendance rate
    let attendanceRate = 0;
    const totalAttendanceRecords = attendanceStats.reduce((sum, s) => sum + s._count.id, 0);
    if (totalAttendanceRecords > 0) {
      const presentCount = attendanceStats
        .filter((s) => s.status === "present" || s.status === "late")
        .reduce((sum, s) => sum + s._count.id, 0);
      attendanceRate = Math.round((presentCount / totalAttendanceRecords) * 100);
    }

    // Build recent activity feed (sorted by date)
    const recentActivity = [
      ...recentStudents.map((s) => ({
        type: "student_created" as const,
        description: `Student ${s.firstName} ${s.lastName} (${s.admissionNo}) was enrolled`,
        date: s.createdAt,
        id: s.id,
      })),
      ...recentTeachers.map((t) => ({
        type: "teacher_created" as const,
        description: `Teacher ${t.firstName} ${t.lastName} (${t.employeeNo}) was hired`,
        date: t.createdAt,
        id: t.id,
      })),
      ...recentClasses.map((c) => ({
        type: "class_created" as const,
        description: `Class ${c.name} (${c.code}) was created`,
        date: c.createdAt,
        id: c.id,
      })),
      ...recentEnrollments.map((e) => ({
        type: "enrollment_created" as const,
        description: `${e.student.firstName} ${e.student.lastName} enrolled in ${e.class.name}`,
        date: e.date,
        id: e.id,
      })),
      ...recentPayments.map((p) => ({
        type: "payment_received" as const,
        description: `Payment of $${p.amount.toFixed(2)} received from ${p.student.firstName} ${p.student.lastName}`,
        date: p.paymentDate,
        id: p.id,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    // Aggregate fee collection by month
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const feeMap = new Map<string, number>();
    feeCollectionByMonth.forEach((p) => {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      feeMap.set(key, (feeMap.get(key) || 0) + p.amount);
    });

    const feeCollectionByMonthFormatted = Array.from(feeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => {
        const [year, month] = key.split("-");
        return {
          month: monthNames[parseInt(month) - 1],
          year: year,
          total: Math.round(total * 100) / 100,
        };
      })
      .slice(-12);

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceRate,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        term: p.term,
        academicYear: p.academicYear,
        paymentDate: p.paymentDate,
        student: p.student,
        feeStructure: p.feeStructure,
      })),
      recentActivity,
      studentEnrollmentByClass: enrollmentByClass.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        studentCount: c._count.enrollments,
      })),
      feeCollectionByMonth: feeCollectionByMonthFormatted,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
