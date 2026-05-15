import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const createApparatusSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  totalQuantity: z.number().int().positive("Quantity must be positive"),
  description: z.string().optional(),
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

    const apparatus = await prisma.scienceApparatus.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ apparatus });
  } catch (error) {
    console.error("Error fetching apparatus:", error);
    return NextResponse.json(
      { error: "Failed to fetch apparatus" },
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
    const body = await request.json();
    const data = createApparatusSchema.parse(body);

    const apparatus = await prisma.scienceApparatus.create({
      data: {
        name: data.name,
        category: data.category,
        totalQuantity: data.totalQuantity,
        available: data.totalQuantity,
        description: data.description,
        ...(schoolId ? { schoolId } : {}),
      },
    });

    return NextResponse.json({ apparatus }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating apparatus:", error);
    return NextResponse.json(
      { error: "Failed to create apparatus" },
      { status: 500 }
    );
  }
}
