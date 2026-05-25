import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/local-rate-limit";

const registerSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  schoolEmail: z.string().email("Invalid school email").optional().or(z.literal("")),
  schoolPhone: z.string().optional().or(z.literal("")),
  schoolAddress: z.string().optional().or(z.literal("")),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Invalid admin email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 registrations per hour per IP
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`register:${ip}`, 3, 3600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = registerSchema.parse(body);

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
        isActive: false,
        isApproved: false,
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
          select: { users: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "School registered successfully. Awaiting approval.",
        school: {
          id: school.id,
          name: school.name,
          slug: school.slug,
          subdomain: school.subdomain,
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

    // Handle Prisma unique constraint violations
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as Record<string, unknown>).code === "P2002"
    ) {
      const target = (error as Record<string, unknown>).meta as Record<string, string[]> | undefined;
      const fields = target?.target ?? [];

      if (fields.includes("email")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      if (fields.includes("slug")) {
        return NextResponse.json(
          { error: "A school with this name already exists" },
          { status: 409 }
        );
      }

      if (fields.includes("subdomain")) {
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

    console.error("Error registering school:", error);
    return NextResponse.json(
      { error: "Failed to register school" },
      { status: 500 }
    );
  }
}
