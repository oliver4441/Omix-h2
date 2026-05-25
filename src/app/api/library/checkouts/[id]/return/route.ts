import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth-helper";

const LIBRARY_ROLES = ["super_admin", "school_admin", "librarian"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(LIBRARY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;

    const existing = await prisma.bookCheckout.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    });
    if (!existing) return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
    if (existing.status === "returned") return NextResponse.json({ error: "Book already returned" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const checkout = await tx.bookCheckout.update({
        where: { id },
        data: { returnDate: new Date(), status: "returned" },
      });
      await tx.libraryBook.update({ where: { id: existing.bookId }, data: { available: { increment: 1 } } });
      return checkout;
    });

    return NextResponse.json({ checkout: result });
  } catch (error) {
    console.error("Error returning book:", error);
    return NextResponse.json({ error: "Failed to return book" }, { status: 500 });
  }
}
