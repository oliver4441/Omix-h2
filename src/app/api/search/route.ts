import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helper";

const RESULT_LIMIT = 8;

/**
 * Global search across students, teachers and classes.
 * GET /api/search?q=...
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q) {
      return NextResponse.json({ students: [], teachers: [], classes: [] });
    }

    const schoolId = user.schoolId;

    const [students, teachers, classes] = await Promise.all([
      prisma.student.findMany({
        where: {
          ...(schoolId ? { schoolId } : {}),
          deletedAt: null,
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { admissionNo: { contains: q } },
            { guardianName: { contains: q } },
          ],
        },
        take: RESULT_LIMIT,
        select: {
          id: true,
          admissionNo: true,
          firstName: true,
          lastName: true,
          status: true,
        },
        orderBy: { admissionNo: "asc" },
      }),
      prisma.teacher.findMany({
        where: {
          ...(schoolId ? { schoolId } : {}),
          deletedAt: null,
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { employeeNo: { contains: q } },
          ],
        },
        take: RESULT_LIMIT,
        select: {
          id: true,
          employeeNo: true,
          firstName: true,
          lastName: true,
          status: true,
        },
        orderBy: { employeeNo: "asc" },
      }),
      prisma.class.findMany({
        where: {
          ...(schoolId ? { schoolId } : {}),
          deletedAt: null,
          OR: [{ name: { contains: q } }, { code: { contains: q } }],
        },
        take: RESULT_LIMIT,
        select: { id: true, name: true, code: true, academicYear: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      students: students.map(
        (s: {
          id: string;
          admissionNo: string;
          firstName: string;
          lastName: string;
          status: string;
        }) => ({
          id: s.id,
          label: `${s.firstName} ${s.lastName} (${s.admissionNo})`,
          sublabel: s.status,
          href: `/students/${s.id}`,
        })
      ),
      teachers: teachers.map(
        (t: {
          id: string;
          employeeNo: string;
          firstName: string;
          lastName: string;
          status: string;
        }) => ({
          id: t.id,
          label: `${t.firstName} ${t.lastName} (${t.employeeNo})`,
          sublabel: t.status,
          href: `/teachers/${t.id}`,
        })
      ),
      classes: classes.map(
        (c: { id: string; name: string; code: string; academicYear: string }) => ({
          id: c.id,
          label: `${c.name} (${c.code})`,
          sublabel: c.academicYear,
          href: `/classes/${c.id}`,
        })
      ),
    });
  } catch (error) {
    console.error("Error in global search:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
