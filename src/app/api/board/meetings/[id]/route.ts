import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";

const updateMeetingSchema = z.object({
  title: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
});

const BOARD_ROLES = ["super_admin", "school_admin", "board_member"];
const BOARD_MODIFY_ROLES = ["super_admin", "school_admin"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(BOARD_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const meeting = await prisma.boardMeeting.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
      include: {
        agendaItems: { orderBy: { order: "asc" } },
        minutes: true,
        recordings: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json({ error: "Failed to fetch meeting" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(BOARD_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const data = updateMeetingSchema.parse(body);

    const existing = await prisma.boardMeeting.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    });
    if (!existing) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    const meeting = await prisma.boardMeeting.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.venue !== undefined && { venue: data.venue }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        agendaItems: { orderBy: { order: "asc" } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ meeting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating meeting:", error);
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(BOARD_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const existing = await prisma.boardMeeting.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    });
    if (!existing) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    await prisma.boardMeeting.delete({ where: { id } });
    return NextResponse.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 });
  }
}
