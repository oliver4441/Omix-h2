import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-helper";

const PRINCIPAL_ROLES = ["super_admin", "school_admin"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(PRINCIPAL_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const schoolId = user.schoolId;
    const baseWhere: Record<string, unknown> = {};
    if (schoolId) baseWhere.schoolId = schoolId;

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
      prisma.student.count({ where: { ...(schoolId ? { schoolId } : {}), status: "active", deletedAt: null } }),
      prisma.teacher.count({ where: { ...(schoolId ? { schoolId } : {}), status: "active", deletedAt: null } }),
      prisma.class.count({ where: { ...(schoolId ? { schoolId } : {}), academicYear: currentYear, deletedAt: null } }),
      Promise.all([
        prisma.feePayment.aggregate({ where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
        prisma.feePayment.findMany({ where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined, select: { studentId: true }, distinct: ["studentId"] }).catch(() => []),
      ]),
      Promise.all([
        prisma.libraryBook.aggregate({ where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined, _sum: { quantity: true, available: true } }).catch(() => ({ _sum: { quantity: 0, available: 0 } })),
        prisma.bookCheckout.count({ where: { ...(schoolId ? { schoolId } : {}), status: "active" } }).catch(() => 0),
      ]),
      prisma.scienceApparatus.aggregate({ where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined, _sum: { totalQuantity: true, broken: true, lost: true } }).catch(() => ({ _sum: { totalQuantity: 0, broken: 0, lost: 0 } })),
      prisma.departmentLog.findMany({
        where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
        take: 20, orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.subjectPerformance.findMany({
        where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
        select: { id: true, classId: true, meanScore: true, subjectId: true, examId: true, term: true, academicYear: true, class: { select: { name: true } } },
        orderBy: { createdAt: "desc" }, take: 50,
      }),
    ]);

    const activeStudentsCount = await prisma.student.count({
      where: { ...(schoolId ? { schoolId } : {}), status: "active", deletedAt: null },
    }).catch(() => 0);

    const paidStudentIds = await prisma.feePayment.findMany({
      where: { ...(schoolId ? { schoolId } : {}), academicYear: currentYear },
      select: { studentId: true }, distinct: ["studentId"],
    }).catch(() => []);

    const paidSet = new Set(paidStudentIds.map((p: any) => p.studentId));

    const classPerformanceMap = new Map<string, { className: string; subjects: Array<{ subjectId: string; meanScore: number | null }>; overallMean: number }>();
    performanceData.forEach((p: any) => {
      if (!p.classId) return;
      const existing = classPerformanceMap.get(p.classId) || { className: p.class?.name || `Class ${p.classId}`, subjects: [] as Array<{ subjectId: string; meanScore: number | null }>, overallMean: 0 };
      existing.subjects.push({ subjectId: p.subjectId, meanScore: p.meanScore });
      classPerformanceMap.set(p.classId, existing);
    });

    classPerformanceMap.forEach((value, key) => {
      const scores = value.subjects.filter((s) => s.meanScore !== null).map((s) => s.meanScore as number);
      value.overallMean = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
      classPerformanceMap.set(key, value);
    });

    return NextResponse.json({
      totalStudents, totalTeachers, totalClasses,
      feeSummary: {
        totalCollected: (feeStats[0] as any)?._sum?.amount || 0,
        pendingCount: Math.max(0, activeStudentsCount - paidSet.size),
      },
      librarySummary: {
        totalBooks: (libraryStats[0] as any)?._sum?.quantity || 0,
        booksCheckedOut: libraryStats[1] as number,
        availableBooks: (libraryStats[0] as any)?._sum?.available || 0,
      },
      labSummary: {
        totalApparatus: (labStats as any)?._sum?.totalQuantity || 0,
        brokenCount: (labStats as any)?._sum?.broken || 0,
        lostCount: (labStats as any)?._sum?.lost || 0,
      },
      recentLogs: recentLogs.map((log: any) => ({
        id: log.id, department: log.department, action: log.action, description: log.description,
        userId: log.userId, user: log.user ? { id: log.user.id, name: log.user.name, email: log.user.email } : null,
        metadata: log.metadata, createdAt: log.createdAt.toISOString(),
      })),
      performanceSummary: {
        classes: Array.from(classPerformanceMap.entries()).map(([classId, data]) => ({
          classId, className: data.className, subjects: data.subjects, overallMean: data.overallMean,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching principal overview:", error);
    return NextResponse.json({ error: "Failed to fetch principal overview" }, { status: 500 });
  }
}
