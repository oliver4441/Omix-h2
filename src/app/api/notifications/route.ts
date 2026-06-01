import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/local-audit";
import { requireRoles, parsePagination } from "@/lib/auth-helper";

const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  targetRole: z.string().optional().nullable(),
  targetDepartmentId: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
});

const NOTIFICATION_ROLES = ["super_admin", "school_admin", "department_head"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(NOTIFICATION_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const priority = searchParams.get("priority") || "";

    const where: any = {};
    if (user.schoolId) where.schoolId = user.schoolId;
    if (priority) where.priority = priority;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, role: true } },
          _count: { select: { reads: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    // Count unread for current user
    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        reads: { none: { userId: user.id } },
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(NOTIFICATION_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = notificationSchema.parse(body);

    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetRole: data.targetRole ?? null,
        targetDepartmentId: data.targetDepartmentId ?? null,
        link: data.link ?? null,
        senderId: user.id,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    audit.created("notification", notification.id, user.id, user.schoolId ?? undefined, {
      title: data.title,
      priority: data.priority,
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
