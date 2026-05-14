import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const feeStructureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  frequency: z.enum(["term", "monthly", "yearly"]).default("term"),
  academicYear: z.string().min(1, "Academic year is required"),
  classId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear") || "";
    const classId = searchParams.get("classId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (academicYear) where.academicYear = academicYear;
    if (classId) where.classId = classId;
    if (schoolId) where.schoolId = schoolId;

    const [structures, total] = await Promise.all([
      prisma.feeStructure.findMany({
        where,
        include: {
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.feeStructure.count({ where }),
    ]);

    return NextResponse.json({
      structures,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return NextResponse.json(
      { error: "Failed to fetch fee structures" },
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
    const data = feeStructureSchema.parse(body);

    const structure = await prisma.feeStructure.create({
      data: {
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        academicYear: data.academicYear,
        classId: data.classId,
        description: data.description,
        ...(schoolId ? { schoolId } : {}),
      },
    });

    return NextResponse.json({ structure }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating fee structure:", error);
    return NextResponse.json(
      { error: "Failed to create fee structure" },
      { status: 500 }
    );
  }
}
