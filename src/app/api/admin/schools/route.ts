import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schoolSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  schoolEmail: z.string().email("Invalid school email").optional().or(z.literal("")),
  schoolPhone: z.string().optional().or(z.literal("")),
  schoolAddress: z.string().optional().or(z.literal("")),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Invalid admin email"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireSuperAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = (session.user as any).role;
  if (userRole !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const forbidden = await requireSuperAdmin();
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { slug: { contains: search } },
        { subdomain: { contains: search } },
      ];
    }

    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;
    else if (status === "approved") where.isApproved = true;
    else if (status === "pending") where.isApproved = false;

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              students: true,
              teachers: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.school.count({ where }),
    ]);

    return NextResponse.json({
      schools,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const forbidden = await requireSuperAdmin();
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const data = schoolSchema.parse(body);

    const slug = generateSlug(data.schoolName);
    const subdomain = slug;

    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    const school = await prisma.school.create({
      data: {
        name: data.schoolName,
        slug,
        subdomain,
        email: data.schoolEmail || null,
        phone: data.schoolPhone || null,
        address: data.schoolAddress || null,
        isActive: true,
        isApproved: true,
        users: {
          create: {
            name: data.adminName,
            email: data.adminEmail,
            password: hashedPassword,
            role: "school_admin",
          },
        },
      },
      include: {
        _count: {
          select: { users: true, students: true, teachers: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "School created successfully",
        school: {
          id: school.id,
          name: school.name,
          slug: school.slug,
          subdomain: school.subdomain,
          isActive: school.isActive,
          isApproved: school.isApproved,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as any).code === "P2002"
    ) {
      const fields: string[] = (error as any).meta?.target ?? [];

      if (fields.includes("email")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      if (fields.includes("slug") || fields.includes("subdomain")) {
        return NextResponse.json(
          { error: "A school with this name already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "A record with that value already exists" },
        { status: 409 }
      );
    }

    console.error("Error creating school:", error);
    return NextResponse.json(
      { error: "Failed to create school" },
      { status: 500 }
    );
  }
}