import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const checkoutSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  admissionNo: z.string().min(1, "Admission number is required"),
  studentName: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;
    if (statusFilter) where.status = statusFilter;

    const checkouts = await prisma.bookCheckout.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            shelf: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
          },
        },
      },
      orderBy: { checkoutDate: "desc" },
    });

    return NextResponse.json({ checkouts });
  } catch (error) {
    console.error("Error fetching checkouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch checkouts" },
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
    const data = checkoutSchema.parse(body);

    const book = await prisma.libraryBook.findFirst({
      where: { id: data.bookId, ...(schoolId ? { schoolId } : {}) },
    });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    if (book.available < 1) {
      return NextResponse.json(
        { error: "No copies available for checkout" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const checkout = await tx.bookCheckout.create({
        data: {
          bookId: data.bookId,
          admissionNo: data.admissionNo,
          studentName: data.studentName,
          dueDate: new Date(data.dueDate),
          status: "active",
          ...(schoolId ? { schoolId } : {}),
        },
      });

      await tx.libraryBook.update({
        where: { id: data.bookId },
        data: { available: { decrement: 1 } },
      });

      return checkout;
    });

    return NextResponse.json({ checkout: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
