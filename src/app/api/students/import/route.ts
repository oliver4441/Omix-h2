import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/csv";
import { requireRoles } from "@/lib/auth-helper";
import { audit } from "@/lib/local-audit";

const IMPORT_ROLES = ["super_admin", "school_admin"];

const MAX_ROWS = 2000;

function normalizeHeader(header: string): string {
  return header.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function normalizeDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Bulk student import from CSV.
 *
 * CSV columns (first row is the header):
 *   admissionNo, firstName, lastName, gender, dateOfBirth, phone, email,
 *   guardianName, guardianPhone, guardianEmail, address, status
 *
 * Students are upserted by admissionNo within the school. If `classId` is
 * provided, an active enrollment is created for the current academic year.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRoles(IMPORT_ROLES);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const classId = (formData.get("classId") as string) || "";
    const academicYear =
      (formData.get("academicYear") as string) ||
      new Date().getFullYear().toString();

    if (!file) {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "CSV file is too large (max 5MB)" }, { status: 400 });
    }

    if (classId && user.schoolId) {
      const classExists = await prisma.class.findFirst({
        where: { id: classId, schoolId: user.schoolId, deletedAt: null },
        select: { id: true },
      });
      if (!classExists) {
        return NextResponse.json({ error: "Class not found" }, { status: 400 });
      }
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV must contain a header row and at least one data row" },
        { status: 400 }
      );
    }

    const headers = rows[0].map(normalizeHeader);
    if (!headers.includes("admissionNo") || !headers.includes("firstName") || !headers.includes("lastName")) {
      return NextResponse.json(
        {
          error:
            "CSV must include at least these columns: admissionNo, firstName, lastName. See the template at /api/students/import/template.",
        },
        { status: 400 }
      );
    }

    const dataRows = rows.slice(1);
    if (dataRows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (${dataRows.length}). Maximum is ${MAX_ROWS} per import.` },
        { status: 400 }
      );
    }

    const col = (row: string[], name: string): string => {
      const idx = headers.indexOf(name);
      return idx >= 0 && idx < row.length ? (row[idx] ?? "").trim() : "";
    };

    const errors: { row: number; error: string }[] = [];
    let imported = 0;
    let updated = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const lineNumber = i + 2; // +1 for header, +1 for 1-based
      const admissionNo = col(row, "admissionNo");
      const firstName = col(row, "firstName");
      const lastName = col(row, "lastName");

      try {
        if (!admissionNo || !firstName || !lastName) {
          throw new Error("admissionNo, firstName and lastName are required");
        }

        const gender = col(row, "gender") || "male";
        if (!["male", "female"].includes(gender)) {
          throw new Error(`gender must be "male" or "female", got "${gender}"`);
        }

        const email = col(row, "email");
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error(`invalid email "${email}"`);
        }

        const status = col(row, "status") || "active";
        if (!["active", "graduated", "transferred"].includes(status)) {
          throw new Error(`invalid status "${status}"`);
        }

        const dateOfBirth = normalizeDate(col(row, "dateOfBirth"));

        let student;
        if (user.schoolId) {
          // Check existence first so we can report created vs updated accurately
          const existing = await prisma.student.findFirst({
            where: { admissionNo, schoolId: user.schoolId },
            select: { id: true },
          });

          student = await prisma.student.upsert({
            where: {
              admissionNo_schoolId: { admissionNo, schoolId: user.schoolId },
            },
            update: {
              firstName,
              lastName,
              gender,
              dateOfBirth: dateOfBirth ?? undefined,
              phone: col(row, "phone") || null,
              email: email || null,
              guardianName: col(row, "guardianName") || null,
              guardianPhone: col(row, "guardianPhone") || null,
              guardianEmail: col(row, "guardianEmail") || null,
              address: col(row, "address") || null,
              status,
            },
            create: {
              admissionNo,
              firstName,
              lastName,
              gender,
              dateOfBirth,
              phone: col(row, "phone") || null,
              email: email || null,
              guardianName: col(row, "guardianName") || null,
              guardianPhone: col(row, "guardianPhone") || null,
              guardianEmail: col(row, "guardianEmail") || null,
              address: col(row, "address") || null,
              status,
              schoolId: user.schoolId,
            },
          });

          if (existing) updated++;
          else imported++;
        } else {
          // Super-admin (no school scope): admissionNo alone isn't unique, so find-or-create
          student = await prisma.student.findFirst({ where: { admissionNo } });
          if (student) {
            student = await prisma.student.update({
              where: { id: student.id },
              data: { firstName, lastName, gender, status },
            });
            updated++;
          } else {
            student = await prisma.student.create({
              data: {
                admissionNo,
                firstName,
                lastName,
                gender,
                dateOfBirth,
                status,
              },
            });
            imported++;
          }
        }

        // Enrollment when classId provided
        if (classId) {
          await prisma.enrollment.upsert({
            where: {
              studentId_classId_academicYear: {
                studentId: student.id,
                classId,
                academicYear,
              },
            },
            update: { status: "active" },
            create: {
              studentId: student.id,
              classId,
              academicYear,
              status: "active",
              schoolId: user.schoolId ?? null,
            },
          });
        }
      } catch (error) {
        errors.push({
          row: lineNumber,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    audit.created("students", "bulk-import", user.id, user.schoolId ?? undefined, {
      imported,
      updated,
      failed: errors.length,
      classId: classId || null,
      academicYear,
    });

    return NextResponse.json({
      imported,
      updated,
      failed: errors.length,
      errors: errors.slice(0, 50),
      totalRows: dataRows.length,
    });
  } catch (error) {
    console.error("Error importing students:", error);
    return NextResponse.json({ error: "Failed to import students" }, { status: 500 });
  }
}
