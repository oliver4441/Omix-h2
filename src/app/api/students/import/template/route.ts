import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth-helper";

const EXPORT_ROLES = ["super_admin", "school_admin"];

/**
 * Download a CSV template for bulk student import.
 * GET /api/students/import/template
 */
export async function GET() {
  const authResult = await requireRoles(EXPORT_ROLES);
  if (authResult instanceof Response) return authResult;

  const csv = [
    "admissionNo,firstName,lastName,gender,dateOfBirth,phone,email,guardianName,guardianPhone,guardianEmail,address,status",
    "2026-001,John,Mwangi,male,2012-05-14,+254712345678,john.mwangi@example.com,Mary Mwangi,+254798765432,mary.mwangi@example.com,Nairobi,active",
    "2026-002,Aisha,Abdullahi,female,2013-01-22,+254711223344,,Ahmed Abdullahi,+254722334455,,Mombasa,active",
  ].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="student-import-template.csv"',
    },
  });
}
