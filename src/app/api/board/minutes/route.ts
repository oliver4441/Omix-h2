import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";

const minuteSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  content: z.string().min(1, "Content is required"),
  agendaItemId: z.string().optional().nullable(),
});

const BOARD_ROLES = ["super_admin", "school_admin", "board_member"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(BOARD_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId") || "";

    const where: Record<string, unknown> = {};
    if (meetingId) where.meetingId = meetingId;
    else if (user.schoolId) where.schoolId = user.schoolId;

    const minutes = await prisma.meetingMinute.findMany({
      where,
      include: {
        meeting: { select: { id: true, title: true, date: true } },
        recordedBy: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error("Error fetching minutes:", error);
    return NextResponse.json({ error: "Failed to fetch minutes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(BOARD_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = minuteSchema.parse(body);

    const boardMember = await prisma.boardMember.findFirst({
      where: { userId: user.id },
    });

    const minute = await prisma.meetingMinute.create({
      data: {
        meetingId: data.meetingId,
        content: data.content,
        agendaItemId: data.agendaItemId ?? null,
        recordedById: boardMember?.id ?? user.id,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      include: {
        meeting: { select: { id: true, title: true, date: true } },
        recordedBy: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ minute }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating minute:", error);
    return NextResponse.json({ error: "Failed to create minute" }, { status: 500 });
  }
}
