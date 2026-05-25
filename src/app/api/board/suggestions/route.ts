import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";

const suggestionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().default("general"),
  meetingId: z.string().optional().nullable(),
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

    const suggestions = await prisma.boardSuggestion.findMany({
      where,
      include: {
        boardMember: { include: { user: { select: { name: true } } } },
        meeting: { select: { id: true, title: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(BOARD_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = suggestionSchema.parse(body);

    const boardMember = await prisma.boardMember.findFirst({
      where: { userId: user.id },
    });

    const suggestion = await prisma.boardSuggestion.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        boardMemberId: boardMember?.id ?? user.id,
        meetingId: data.meetingId ?? null,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      include: {
        boardMember: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating suggestion:", error);
    return NextResponse.json({ error: "Failed to create suggestion" }, { status: 500 });
  }
}
