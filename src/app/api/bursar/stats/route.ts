import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-helper";

const BURSAR_ROLES = ["super_admin", "school_admin", "bursar"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(BURSAR_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const schoolId = user.schoolId;
    const baseWhere: Record<string, unknown> = {};
    if (schoolId) baseWhere.schoolId = schoolId;

    const [totalCollected, paymentCount, studentCount] = await Promise.all([
      prisma.feePayment.aggregate({
        where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
        _sum: { amount: true },
      }),
      prisma.feePayment.count({
        where: Object.keys(baseWhere).length > 0 ? baseWhere : undefined,
      }),
      prisma.student.count({
        where: schoolId ? { schoolId, status: "active", deletedAt: null } : { status: "active", deletedAt: null },
      }),
    ]);

    return NextResponse.json({
      totalCollected: totalCollected._sum.amount || 0,
      paymentCount,
      studentCount,
    });
  } catch (error) {
    console.error("Error fetching bursar stats:", error);
    return NextResponse.json({ error: "Failed to fetch bursar stats" }, { status: 500 });
  }
}
