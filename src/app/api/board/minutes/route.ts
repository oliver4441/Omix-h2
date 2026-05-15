import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const createMinuteSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  agendaItemId: z.string().optional(),
  content: z.string().min(1, "Content is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;

    const minutes = await prisma.meetingMinute.findMany({
      where,
      include: {
        meeting: {
          select: { id: true, title: true, date: true },
        },
        agendaItem: {
          select: { id: true, title: true },
        },
        recordedBy: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error("Error fetching minutes:", error);
    return NextResponse.json(
      { error: "Failed to fetch minutes" },
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
    const data = createMinuteSchema.parse(body);

    // Find the board member record for the current user
    const boardMember = await prisma.boardMember.findUnique({
      where: { userId },
    });
    if (!boardMember) {
      return NextResponse.json(
        { error: "User is not a board member" },
        { status: 403 }
      );
    }

    // Mock AI processing
    const aiSummary = data.content
      ? "AI summary: " + data.content.substring(0, 200)
      : null;
    const aiProofread = data.content ? data.content : null;

    const minute = await prisma.meetingMinute.create({
      data: {
        meetingId: data.meetingId,
        agendaItemId: data.agendaItemId,
        content: data.content,
        aiSummary,
        aiProofread,
        recordedById: boardMember.id,
        ...(schoolId ? { schoolId } : {}),
      },
      include: {
        meeting: {
          select: { id: true, title: true },
        },
        agendaItem: {
          select: { id: true, title: true },
        },
        recordedBy: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ minute }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating minute:", error);
    return NextResponse.json(
      { error: "Failed to create minute" },
      { status: 500 }
    );
  }
}
