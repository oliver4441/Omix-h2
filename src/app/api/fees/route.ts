import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/local-audit";
import { requireRoles, parsePagination } from "@/lib/auth-helper";

const feePaymentSchema = z.object({
  feeStructureId: z.string().min(1, "Fee structure ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentDate: z.string().optional(),
  method: z.enum(["cash", "mpesa", "bank", "card"]).default("cash"),
  transactionRef: z.string().optional().nullable(),
  term: z.string().min(1, "Term is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  notes: z.string().optional().nullable(),
});

const FEE_MODIFY_ROLES = ["super_admin", "school_admin", "bursar"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(FEE_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const studentId = searchParams.get("studentId") || "";
    const term = searchParams.get("term") || "";
    const academicYear = searchParams.get("academicYear") || "";
    const feeStructureId = searchParams.get("feeStructureId") || "";

    const where: Record<string, unknown> = {};

    if (studentId) where.studentId = studentId;
    if (term) where.term = term;
    if (academicYear) where.academicYear = academicYear;
    if (feeStructureId) where.feeStructureId = feeStructureId;
    if (user.schoolId) where.schoolId = user.schoolId;

    const [payments, totalPayments] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include: {
          feeStructure: {
            select: { id: true, name: true, amount: true, frequency: true },
          },
          student: {
            select: { id: true, admissionNo: true, firstName: true, lastName: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { paymentDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.feePayment.count({ where }),
    ]);

    const feeStructures = await prisma.feeStructure.findMany({
      where: user.schoolId ? { schoolId: user.schoolId } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      payments,
      feeStructures,
      total: totalPayments,
      page,
      totalPages: Math.ceil(totalPayments / limit),
    });
  } catch (error) {
    console.error("Error fetching fees data:", error);
    return NextResponse.json(
      { error: "Failed to fetch fees data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(FEE_MODIFY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = feePaymentSchema.parse(body);

    const payment = await prisma.feePayment.create({
      data: {
        feeStructureId: data.feeStructureId,
        studentId: data.studentId,
        userId: user.id,
        amount: data.amount,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        method: data.method,
        transactionRef: data.transactionRef ?? null,
        term: data.term,
        academicYear: data.academicYear,
        notes: data.notes ?? null,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      include: {
        feeStructure: {
          select: { id: true, name: true, amount: true },
        },
        student: {
          select: { id: true, admissionNo: true, firstName: true, lastName: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    audit.created("fee_payment", payment.id, user.id, user.schoolId ?? undefined, {
      studentId: data.studentId,
      amount: data.amount,
      method: data.method,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating fee payment:", error);
    return NextResponse.json(
      { error: "Failed to create fee payment" },
      { status: 500 }
    );
  }
}
