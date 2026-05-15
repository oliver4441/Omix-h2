import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const agendaItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  order: z.number().int().min(0),
  duration: z.number().int().positive().optional(),
});

const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  agendaItems: z.array(agendaItemSchema).optional(),
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

    const meetings = await prisma.boardMeeting.findMany({
      where,
      include: {
        _count: {
          select: { agendaItems: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
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
    const data = createMeetingSchema.parse(body);

    const meeting = await prisma.boardMeeting.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        createdById: userId,
        ...(schoolId ? { schoolId } : {}),
        ...(data.agendaItems && data.agendaItems.length > 0
          ? {
              agendaItems: {
                create: data.agendaItems.map((item) => ({
                  title: item.title,
                  description: item.description,
                  order: item.order,
                  duration: item.duration,
                  ...(schoolId ? { schoolId } : {}),
                })),
              },
            }
          : {}),
      },
      include: {
        agendaItems: {
          orderBy: { order: "asc" },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}
