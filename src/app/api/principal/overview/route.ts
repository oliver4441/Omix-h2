import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;

    const baseWhere: Record<string, unknown> = {};
    if (schoolId) {
      baseWhere.schoolId = schoolId;
    }

    const currentYear = new Date().getFullYear().toString();

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      feeStats,
      libraryStats,
      labStats,
      recentLogs,
      performanceData,
    ] = await Promise.all([
      // Total active students
      prisma.student.count({
        where: {
          ...(schoolId ? { schoolId } : {}),
          status: "active",
        },
      }),

      // Total active teachers
      prisma.teacher.count({
        where: {
          ...(schoolId ? { schoolId } : {}),
          status: "active",
        },
      }),

      // Total classes for current academic year
      prisma.class.count({
        where: {
          ...(schoolId ? { schoolId } : {}),
          academicYear: currentYear,
        },
      }),

      // Fee summary
      Promise.all([
        prisma.feePayment.aggregate({
          where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
          _sum: { amount: true },
        }),
        prisma.feePayment.findMany({
          where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
          select: { studentId: true },
          distinct: ["studentId"],
        }),
      ]).then(([aggregate, payerStudents]) => {
        // Count students who have fee structures but haven't paid
        // active students count minus distinct payers
        return {
          totalCollected: aggregate._sum.amount || 0,
          pendingCount: 0, // Computed below
        };
      }),

      // Library summary
      Promise.all([
        prisma.libraryBook.aggregate({
          where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
          _sum: { quantity: true, available: true },
        }),
        prisma.bookCheckout.count({
          where: {
            ...(schoolId ? { schoolId } : {}),
            status: "active",
          },
        }),
      ]).then(([books, checkedOut]) => ({
        totalBooks: books._sum.quantity || 0,
        booksCheckedOut: checkedOut,
        availableBooks: books._sum.available || 0,
      })),

      // Science lab summary
      Promise.all([
        prisma.scienceApparatus.aggregate({
          where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
          _sum: { totalQuantity: true, broken: true, lost: true },
        }),
      ]).then(([app]) => ({
        totalApparatus: app._sum.totalQuantity || 0,
        brokenCount: app._sum.broken || 0,
        lostCount: app._sum.lost || 0,
      })),

      // Recent department logs (last 20)
      prisma.departmentLog.findMany({
        where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),

      // Performance summary (latest exam mean scores by class)
      prisma.subjectPerformance.findMany({
        where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
        select: {
          id: true,
          classId: true,
          meanScore: true,
          subjectId: true,
          examId: true,
          term: true,
          academicYear: true,
          class: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // Group performance by class
    const classPerformanceMap = new Map<string, { className: string; subjects: { subjectId: string; meanScore: number | null }[]; overallMean: number }>();
    performanceData.forEach((p) => {
      if (!p.classId) return;
      const existing = classPerformanceMap.get(p.classId) || {
        className: p.class?.name || `Class ${p.classId}`,
        subjects: [],
        overallMean: 0,
      };
      existing.subjects.push({
        subjectId: p.subjectId,
        meanScore: p.meanScore,
      });
      classPerformanceMap.set(p.classId, existing);
    });

    // Calculate overall mean per class
    classPerformanceMap.forEach((value, key) => {
      const scores = value.subjects.filter((s) => s.meanScore !== null).map((s) => s.meanScore as number);
      value.overallMean = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0;
      classPerformanceMap.set(key, value);
    });

    // Compute pending count more accurately: active students whose fees haven't been paid in current year
    const activeStudentsCount = await prisma.student.count({
      where: {
        ...(schoolId ? { schoolId } : {}),
        status: "active",
      },
    });

    const paidStudentIds = await prisma.feePayment.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        academicYear: currentYear,
      },
      select: { studentId: true },
      distinct: ["studentId"],
    });

    const paidSet = new Set(paidStudentIds.map((p) => p.studentId));

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      feeSummary: {
        totalCollected: feeStats.totalCollected,
        pendingCount: Math.max(0, activeStudentsCount - paidSet.size),
      },
      librarySummary: libraryStats,
      labSummary: labStats,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        department: log.department,
        action: log.action,
        description: log.description,
        userId: log.userId,
        user: log.user
          ? { id: log.user.id, name: log.user.name, email: log.user.email }
          : null,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
      performanceSummary: {
        classes: Array.from(classPerformanceMap.entries()).map(
          ([classId, data]) => ({
            classId,
            className: data.className,
            subjects: data.subjects,
            overallMean: data.overallMean,
          })
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching principal overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch principal overview" },
      { status: 500 }
    );
  }
}
