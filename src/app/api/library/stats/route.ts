import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-helper";

const LIBRARY_STATS_ROLES = ["super_admin", "school_admin", "librarian"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(LIBRARY_STATS_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const where: Record<string, unknown> = {};
    if (user.schoolId) where.schoolId = user.schoolId;

    const [bookAgg, activeCheckouts, overdueCount] = await Promise.all([
      prisma.libraryBook.aggregate({
        where,
        _sum: { quantity: true, available: true },
        _count: { id: true },
      }),
      prisma.bookCheckout.count({ where: { ...where, status: "active" } }),
      prisma.bookCheckout.count({
        where: { ...where, status: "active", dueDate: { lt: new Date() } },
      }),
    ]);

    return NextResponse.json({
      totalBooks: bookAgg._sum.quantity || 0,
      availableBooks: bookAgg._sum.available || 0,
      activeCheckouts,
      overdueCount,
      uniqueTitles: bookAgg._count.id,
    });
  } catch (error) {
    console.error("Error fetching library stats:", error);
    return NextResponse.json({ error: "Failed to fetch library stats" }, { status: 500 });
  }
}
