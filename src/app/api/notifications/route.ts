import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-helper";

const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  targetRole: z.string().optional(),
  targetDepartmentId: z.string().optional(),
  link: z.string().optional(),
});

const NOTIFICATION_CREATE_ROLES = ["super_admin", "school_admin", "department_head", "teacher"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const where: Record<string, unknown> = {};
    if (user.schoolId) where.schoolId = user.schoolId;

    const orFilters: Record<string, unknown>[] = [
      { targetRole: null },
      { targetRole: user.role },
    ];
    if (user.departmentId) {
      orFilters.push({ targetDepartmentId: user.departmentId });
    }
    where.OR = orFilters;

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true } },
        reads: {
          where: { userId: user.id },
          select: { readAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const notificationsWithStatus = notifications.map((n) => ({
      ...n,
      isRead: n.reads.length > 0,
    }));

    const unreadCount = notificationsWithStatus.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: notificationsWithStatus,
      unreadCount,
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
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    if (!NOTIFICATION_CREATE_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = createNotificationSchema.parse(body);

    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority || "normal",
        senderId: user.id,
        targetRole: data.targetRole,
        targetDepartmentId: data.targetDepartmentId,
        link: data.link,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
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
