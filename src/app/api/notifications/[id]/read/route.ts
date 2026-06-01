import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-helper";

const NOTIFICATION_READ_ROLES = ["super_admin", "school_admin", "teacher", "department_head", "bursar", "librarian", "lab_technician", "computer_lab", "class_teacher"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(NOTIFICATION_READ_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;
    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const read = await prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId: id,
          userId: user.id,
        },
      },
      update: { readAt: new Date() },
      create: {
        notificationId: id,
        userId: user.id,
      },
    });

    return NextResponse.json({ read });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
