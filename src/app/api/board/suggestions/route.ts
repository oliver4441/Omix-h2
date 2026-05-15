import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const createSuggestionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["general", "finance", "academics", "infrastructure", "welfare"]),
  meetingId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;
    if (category) where.category = category;

    const suggestions = await prisma.boardSuggestion.findMany({
      where,
      include: {
        boardMember: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        meeting: {
          select: { id: true, title: true, date: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
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
    const data = createSuggestionSchema.parse(body);

    const boardMember = await prisma.boardMember.findUnique({
      where: { userId },
    });
    if (!boardMember) {
      return NextResponse.json(
        { error: "User is not a board member" },
        { status: 403 }
      );
    }

    const suggestion = await prisma.boardSuggestion.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        boardMemberId: boardMember.id,
        ...(data.meetingId ? { meeting: { connect: { id: data.meetingId } } } : {}),
        ...(schoolId ? { schoolId } : {}),
      },
      include: {
        boardMember: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating suggestion:", error);
    return NextResponse.json(
      { error: "Failed to create suggestion" },
      { status: 500 }
    );
  }
}
