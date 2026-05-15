import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  slug: z.string().min(1, "Slug is required"),
  type: z.enum(["academic", "lab", "library", "bursar", "computer_lab"]),
  headId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (schoolId) where.schoolId = schoolId;

    const departments = await prisma.department.findMany({
      where,
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
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

    const role = (session.user as any).role;
    if (role !== "school_admin" && role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden: only school_admin or super_admin can create departments" },
        { status: 403 }
      );
    }

    const schoolId = (session.user as any).schoolId;
    if (!schoolId && role !== "super_admin") {
      return NextResponse.json(
        { error: "School ID is required to create a department" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = departmentSchema.parse(body);

    const department = await prisma.department.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        ...(schoolId ? { schoolId } : {}),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    // Assign head to department after creation (connect not available in UncheckedInput)
    if (data.headId) {
      await prisma.user.update({
        where: { id: data.headId },
        data: { departmentId: department.id },
      });
    }

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
