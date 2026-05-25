import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  year: z.number().int().optional(),
  quantity: z.number().int().positive().optional(),
  shelf: z.string().optional(),
  category: z.string().optional(),
});

const LIBRARY_ROLES = ["super_admin", "school_admin", "librarian"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(LIBRARY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const book = await prisma.libraryBook.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
      include: {
        checkouts: {
          include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
          orderBy: { checkoutDate: "desc" },
          take: 10,
        },
        _count: { select: { checkouts: true } },
      },
    });

    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(LIBRARY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const data = updateBookSchema.parse(body);

    const existing = await prisma.libraryBook.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    });
    if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.isbn !== undefined) updateData.isbn = data.isbn;
    if (data.publisher !== undefined) updateData.publisher = data.publisher;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.shelf !== undefined) updateData.shelf = data.shelf;
    if (data.category !== undefined) updateData.category = data.category;

    if (data.quantity !== undefined) {
      const diff = data.quantity - existing.quantity;
      updateData.quantity = data.quantity;
      updateData.available = existing.available + diff;
      if ((updateData.available as number) < 0) {
        return NextResponse.json({ error: "Quantity cannot be less than currently checked out copies" }, { status: 400 });
      }
    }

    const book = await prisma.libraryBook.update({ where: { id }, data: updateData });
    return NextResponse.json({ book });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error updating book:", error);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(LIBRARY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const existing = await prisma.libraryBook.findFirst({
      where: { id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    });
    if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    if (existing.available < existing.quantity) {
      return NextResponse.json({ error: "Cannot delete book with active checkouts" }, { status: 400 });
    }

    await prisma.libraryBook.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
