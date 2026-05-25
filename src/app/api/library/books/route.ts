import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";

const createBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  year: z.number().int().optional(),
  quantity: z.number().int().positive("Quantity must be positive"),
  shelf: z.string().optional(),
  category: z.string().optional(),
});

const LIBRARY_ROLES = ["super_admin", "school_admin", "librarian"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRoles(LIBRARY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (user.schoolId) where.schoolId = user.schoolId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
      ];
    }

    const books = await prisma.libraryBook.findMany({ where, orderBy: { title: "asc" } });
    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(LIBRARY_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const data = createBookSchema.parse(body);

    const book = await prisma.libraryBook.create({
      data: {
        title: data.title, author: data.author, isbn: data.isbn,
        publisher: data.publisher, year: data.year, quantity: data.quantity,
        available: data.quantity, shelf: data.shelf, category: data.category,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Error creating book:", error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
