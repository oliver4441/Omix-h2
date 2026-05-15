import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  targetRole: z.string().optional(),
  targetDepartmentId: z.string().optional(),
  link: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const userId = session.user.id;
    const userRole = (session.user as any).role;
    const userDepartmentId = (session.user as any).departmentId;

    // Build notification query based on user role/department
    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;

    // Notifications targeting all roles, the user's specific role, or their department
    where.OR = [
      { targetRole: null },
      { targetRole: userRole },
    ];
    if (userDepartmentId) {
      where.OR.push({ targetDepartmentId: userDepartmentId });
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        sender: {
          select: { id: true, name: true },
        },
        reads: {
          where: { userId },
          select: { readAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add read status and count unread
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const userId = session.user.id;
    const body = await request.json();
    const data = createNotificationSchema.parse(body);

    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority || "normal",
        senderId: userId,
        targetRole: data.targetRole,
        targetDepartmentId: data.targetDepartmentId,
        link: data.link,
        ...(schoolId ? { schoolId } : {}),
      },
      include: {
        sender: {
          select: { id: true, name: true },
        },
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
