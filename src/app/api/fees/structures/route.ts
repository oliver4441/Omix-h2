import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles, parsePagination } from "@/lib/auth-helper";
import { z } from "zod";

const feeStructureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  frequency: z.enum(["term", "monthly", "yearly"]).default("term"),
  academicYear: z.string().min(1, "Academic year is required"),
  classId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const FEE_MODIFY_ROLES = ["super_admin", "school_admin", "bursar"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(FEE_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const academicYear = searchParams.get("academicYear") || "";
    const classId = searchParams.get("classId") || "";

    const where: Record<string, unknown> = {};
    if (academicYear) where.academicYear = academicYear;
    if (classId) where.classId = classId;
    if (user.schoolId) where.schoolId = user.schoolId;

    const [structures, total] = await Promise.all([
      prisma.feeStructure.findMany({
        where, include: { _count: { select: { payments: true } } },
        orderBy: { name: "asc" }, skip, take: limit,
      }),
      prisma.feeStructure.count({ where }),
    ]);

    return NextResponse.json({ structures, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return NextResponse.json({ error: "Failed to fetch fee structures" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(FEE_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = feeStructureSchema.parse(body);

    const structure = await prisma.feeStructure.create({
      data: {
        name: data.name, amount: data.amount, frequency: data.frequency,
        academicYear: data.academicYear, classId: data.classId, description: data.description,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    return NextResponse.json({ structure }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating fee structure:", error);
    return NextResponse.json({ error: "Failed to create fee structure" }, { status: 500 });
  }
}
