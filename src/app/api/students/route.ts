import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/local-audit";
import { requireRoles } from "@/lib/auth-helper";

const studentSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.string().email().optional().nullable().or(z.literal("")),
  status: z.enum(["active", "graduated", "transferred"]).default("active"),
  classId: z.string().optional().nullable(),
  academicYear: z.string().optional().nullable(),
});

const STUDENT_MODIFY_ROLES = ["super_admin", "school_admin"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(STUDENT_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (user.schoolId) where.schoolId = user.schoolId;

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { admissionNo: { contains: search } },
        { guardianName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) where.status = status;
    if (classId) {
      where.enrollments = {
        some: {
          classId,
          status: "active",
        },
      };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            include: { class: true },
            where: { status: "active" },
            take: 1,
          },
          _count: {
            select: { attendance: true, grades: true, feePayments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(STUDENT_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = studentSchema.parse(body);

    const student = await prisma.student.create({
      data: {
        admissionNo: data.admissionNo,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        phone: data.phone,
        email: data.email || null,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail || null,
        status: data.status,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    if (data.classId && data.academicYear) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: data.classId,
          academicYear: data.academicYear,
          status: "active",
          ...(user.schoolId ? { schoolId: user.schoolId } : {}),
        },
      });
    }

    audit.created("student", student.id, user.id, user.schoolId ?? undefined, {
      admissionNo: data.admissionNo,
      name: `${data.firstName} ${data.lastName}`,
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
