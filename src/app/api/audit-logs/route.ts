import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalDb } from "@/lib/local-db";
import { requireRoles } from "@/lib/auth-helper";

const AUDIT_ROLES = ["super_admin", "school_admin"];

/**
 * Audit log viewer backed by the local SQLite AuditLog table.
 * GET /api/audit-logs?page=&limit=&entity=&action=&from=&to=&schoolId=
 * School admins only see their own school's entries; super admins can filter by schoolId.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(AUDIT_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1");
    const rawLimit = parseInt(searchParams.get("limit") || "25");
    const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 25;
    const skip = (page - 1) * limit;

    const entity = searchParams.get("entity") || "";
    const action = searchParams.get("action") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    // School admins are always scoped to their school
    const schoolId =
      user.role === "super_admin" ? searchParams.get("schoolId") || null : user.schoolId;

    let db;
    try {
      db = getLocalDb();
    } catch (error) {
      console.error("Local DB unavailable for audit logs:", error);
      return NextResponse.json({
        available: false,
        logs: [],
        total: 0,
        page,
        totalPages: 0,
      });
    }

    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    // Resolve user names from the primary database for display
    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[];
    let userNames: Record<string, string> = {};
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });
      userNames = Object.fromEntries(
        users.map((u: { id: string; name: string }) => [u.id, u.name])
      );
    }

    const items = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.userId ? userNames[log.userId] ?? null : null,
      schoolId: log.schoolId,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      available: true,
      logs: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
