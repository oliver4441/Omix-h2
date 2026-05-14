import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "activate", "deactivate"]),
});

async function requireSuperAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = (session.user as any).role;
  if (userRole !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireSuperAdmin();
  if (forbidden) return forbidden;

  try {
    const { id } = await params;

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
            classes: true,
            subjects: true,
            feeStructures: true,
            feePayments: true,
            announcements: true,
            exams: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json(
      { error: "Failed to fetch school" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireSuperAdmin();
  if (forbidden) return forbidden;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = actionSchema.parse(body);

    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    let updateData: Record<string, boolean> = {};

    switch (action) {
      case "approve":
        updateData = { isApproved: true };
        break;
      case "reject":
        updateData = { isApproved: false };
        break;
      case "activate":
        updateData = { isActive: true, isApproved: true };
        break;
      case "deactivate":
        updateData = { isActive: false };
        break;
    }

    const school = await prisma.school.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true,
        isApproved: true,
        updatedAt: true,
      },
    });

    const actionLabels: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      activate: "activated",
      deactivate: "deactivated",
    };

    return NextResponse.json({
      message: `School ${actionLabels[action]} successfully`,
      school,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating school:", error);
    return NextResponse.json(
      { error: "Failed to update school" },
      { status: 500 }
    );
  }
}
