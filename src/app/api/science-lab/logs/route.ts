import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const logActionSchema = z.object({
  apparatusId: z.string().min(1, "Apparatus ID is required"),
  action: z.enum(["broken", "lost", "repaired", "restocked", "discarded"]),
  quantity: z.number().int().positive("Quantity must be positive"),
  notes: z.string().optional(),
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

    const logs = await prisma.apparatusLog.findMany({
      where,
      include: {
        apparatus: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching apparatus logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch apparatus logs" },
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
    const data = logActionSchema.parse(body);

    const apparatus = await prisma.scienceApparatus.findFirst({
      where: { id: data.apparatusId, ...(schoolId ? { schoolId } : {}) },
    });
    if (!apparatus) {
      return NextResponse.json(
        { error: "Apparatus not found" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, number | { increment: number } | { decrement: number }> = {};

      switch (data.action) {
        case "broken":
          if (apparatus.available < data.quantity) {
            throw new Error("Not enough available items to mark as broken");
          }
          updateData.available = { decrement: data.quantity };
          updateData.broken = { increment: data.quantity };
          break;
        case "lost":
          if (apparatus.available < data.quantity) {
            throw new Error("Not enough available items to mark as lost");
          }
          updateData.available = { decrement: data.quantity };
          updateData.lost = { increment: data.quantity };
          break;
        case "repaired":
          if (apparatus.broken < data.quantity) {
            throw new Error("Not enough broken items to repair");
          }
          updateData.broken = { decrement: data.quantity };
          updateData.available = { increment: data.quantity };
          break;
        case "restocked":
          updateData.totalQuantity = { increment: data.quantity };
          updateData.available = { increment: data.quantity };
          break;
        case "discarded":
          if (apparatus.broken < data.quantity) {
            throw new Error("Not enough broken items to discard");
          }
          updateData.broken = { decrement: data.quantity };
          updateData.totalQuantity = { decrement: data.quantity };
          break;
      }

      await tx.scienceApparatus.update({
        where: { id: data.apparatusId },
        data: updateData,
      });

      const log = await tx.apparatusLog.create({
        data: {
          apparatusId: data.apparatusId,
          action: data.action,
          quantity: data.quantity,
          notes: data.notes,
          reportedById: userId,
          ...(schoolId ? { schoolId } : {}),
        },
      });

      return log;
    });

    return NextResponse.json({ log: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to log action";
    console.error("Error logging apparatus action:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
