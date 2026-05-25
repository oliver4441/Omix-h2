import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles, parsePagination } from "@/lib/auth-helper";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  target: z.enum(["all", "students", "teachers", "class"]).default("all"),
  classId: z.string().optional().nullable(),
});

const ANNOUNCEMENT_ROLES = ["super_admin", "school_admin", "teacher", "department_head"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(ANNOUNCEMENT_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const target = searchParams.get("target") || "";
    const priority = searchParams.get("priority") || "";

    const where: Record<string, unknown> = {};

    if (target) where.target = target;
    if (priority) where.priority = priority;
    if (user.schoolId) where.schoolId = user.schoolId;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    const priorityWeight: Record<string, number> = {
      urgent: 0, high: 1, normal: 2, low: 3,
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
    const authResult = await requireRoles(ANNOUNCEMENT_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = announcementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: user.id,
        priority: data.priority,
        target: data.target,
        classId: data.classId ?? null,
        schoolId: user.schoolId ?? null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
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
