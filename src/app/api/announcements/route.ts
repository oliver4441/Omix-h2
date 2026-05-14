import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  target: z.enum(["all", "students", "teachers", "class"]).default("all"),
  classId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("target") || "";
    const priority = searchParams.get("priority") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (target) where.target = target;
    if (priority) where.priority = priority;
    if (schoolId) where.schoolId = schoolId;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    // Sort by priority weight manually since SQLite doesn't support custom ordering
    const priorityWeight: Record<string, number> = {
      urgent: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    const sorted = announcements.sort(
      (a, b) =>
        (priorityWeight[a.priority] ?? 2) - (priorityWeight[b.priority] ?? 2) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      announcements: sorted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = announcementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: session.user.id,
        priority: data.priority,
        target: data.target,
        classId: data.classId ?? null,
        schoolId: (session.user as any)?.schoolId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
