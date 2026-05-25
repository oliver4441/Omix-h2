import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";

const meetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
});

const BOARD_ROLES = ["super_admin", "school_admin", "board_member"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(BOARD_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (user.schoolId) where.schoolId = user.schoolId;

    const meetings = await prisma.boardMeeting.findMany({
      where,
      include: {
        agendaItems: { orderBy: { order: "asc" } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { agendaItems: true, minutes: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(BOARD_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = meetingSchema.parse(body);

    const meeting = await prisma.boardMeeting.create({
      data: {
        title: data.title, date: new Date(data.date),
        startTime: data.startTime, endTime: data.endTime,
        venue: data.venue, status: data.status,
        createdById: user.id,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      include: {
        agendaItems: { orderBy: { order: "asc" } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating meeting:", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }
}
