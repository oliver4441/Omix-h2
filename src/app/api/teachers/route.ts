import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const teacherSchema = z.object({
  employeeNo: z.string().min(1, "Employee number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female"]).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  qualification: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (schoolId) where.schoolId = schoolId;

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeNo: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) where.status = status;

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: {
          _count: {
            select: { classes: true, subjects: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.teacher.count({ where }),
    ]);

    return NextResponse.json({
      teachers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = teacherSchema.parse(body);

    const teacher = await prisma.teacher.create({
      data: {
        employeeNo: data.employeeNo,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        phone: data.phone,
        email: data.email || null,
        qualification: data.qualification,
        specialization: data.specialization,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        status: data.status,
      },
    });

    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}
