import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRoles } from "@/lib/auth-helper";
import { audit } from "@/lib/local-audit";

const SETTINGS_ROLES = ["super_admin", "school_admin"];

const schoolUpdateSchema = z.object({
  name: z.string().min(1, "School name is required").optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable(),
  motto: z.string().optional().nullable(),
  academicYear: z.string().optional().nullable(),
  currentTerm: z.string().optional().nullable(),
  termStart: z.string().optional().nullable(),
  termEnd: z.string().optional().nullable(),
});

const SETTING_KEYS = [
  "website",
  "motto",
  "academicYear",
  "currentTerm",
  "termStart",
  "termEnd",
] as const;

/**
 * School settings — GET returns school profile fields plus key/value settings
 * (academic year, current term, term dates, website, motto).
 */
export async function GET() {
  try {
    const authResult = await requireRoles(SETTINGS_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    if (!user.schoolId) {
      return NextResponse.json(
        { error: "Super admin accounts are not linked to a school" },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      include: { settings: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const settings: Record<string, string> = {};
    for (const s of school.settings) {
      if (s.value !== null) settings[s.key] = s.value;
    }

    return NextResponse.json({
      school: {
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        website: settings.website ?? "",
        motto: settings.motto ?? "",
        academicYear: settings.academicYear ?? new Date().getFullYear().toString(),
        currentTerm: settings.currentTerm ?? "Term 1",
        termStart: settings.termStart ?? "",
        termEnd: settings.termEnd ?? "",
      },
      settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

/**
 * Update school profile fields and key/value settings.
 * The settings page posts { school: {...} }.
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireRoles(SETTINGS_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    if (!user.schoolId) {
      return NextResponse.json(
        { error: "Super admin accounts are not linked to a school" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const payload = body.school ?? body;
    const data = schoolUpdateSchema.parse(payload);

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { id: true },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Update profile fields on the School row
    const schoolData: Record<string, unknown> = {};
    for (const field of ["name", "address", "phone", "email"] as const) {
      if (data[field] !== undefined) schoolData[field] = data[field] || null;
    }
    if (Object.keys(schoolData).length > 0) {
      await prisma.school.update({ where: { id: school.id }, data: schoolData });
    }

    // Upsert key/value settings
    for (const key of SETTING_KEYS) {
      if (data[key] !== undefined) {
        await prisma.schoolSetting.upsert({
          where: { schoolId_key: { schoolId: school.id, key } },
          update: { value: data[key] ?? null },
          create: { schoolId: school.id, key, value: data[key] ?? null },
        });
      }
    }

    audit.updated("school", school.id, user.id, user.schoolId ?? undefined, {
      fields: Object.keys(data),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
