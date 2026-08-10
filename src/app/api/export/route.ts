import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { requireRoles } from "@/lib/auth-helper";
import { audit } from "@/lib/local-audit";

interface StudentRow {
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date | null;
  phone: string | null;
  email: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  enrollments: { class: { name: string } | null }[];
  status: string;
}

interface TeacherRow {
  employeeNo: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  qualification: string | null;
  specialization: string | null;
  status: string;
}

interface ClassRow {
  name: string;
  code: string;
  academicYear: string;
  capacity: number | null;
  _count: { enrollments: number };
}

interface AttendanceRow {
  date: Date;
  status: string;
  remarks: string | null;
  student: { admissionNo: string; firstName: string; lastName: string };
  class: { name: string; code: string };
}

interface GradeRow {
  score: number | null;
  grade: string | null;
  remarks: string | null;
  student: { admissionNo: string; firstName: string; lastName: string };
  subject: { name: string };
  exam: { name: string; term: string; academicYear: string };
}

interface FeeRow {
  paymentDate: Date;
  amount: number;
  method: string;
  transactionRef: string | null;
  term: string;
  academicYear: string;
  student: { admissionNo: string; firstName: string; lastName: string };
  feeStructure: { name: string };
  user: { name: string };
}

interface BookRow {
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  year: number | null;
  quantity: number;
  available: number;
  shelf: string | null;
  category: string | null;
}

interface ApparatusRow {
  name: string;
  category: string | null;
  totalQuantity: number;
  available: number;
  broken: number;
  lost: number;
  description: string | null;
}

interface AnnouncementRow {
  createdAt: Date;
  title: string;
  priority: string;
  target: string;
  author: { name: string };
}

interface ExamRow {
  name: string;
  term: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  description: string | null;
}

interface CheckoutRow {
  checkoutDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: string;
  admissionNo: string;
  studentName: string | null;
  book: { title: string };
}

/**
 * CSV export for the main modules.
 * GET /api/export?entity=students&format=csv[&classId=&status=&date=&examId=&term=&academicYear=&search=]
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity") || "";

  const roleMap: Record<string, string[]> = {
    students: ["super_admin", "school_admin"],
    teachers: ["super_admin", "school_admin"],
    classes: ["super_admin", "school_admin"],
    attendance: ["super_admin", "school_admin", "teacher", "department_head", "class_teacher"],
    grades: ["super_admin", "school_admin", "teacher", "department_head"],
    fees: ["super_admin", "school_admin", "bursar"],
    books: ["super_admin", "school_admin", "librarian"],
    apparatus: ["super_admin", "school_admin", "lab_technician"],
    announcements: ["super_admin", "school_admin", "teacher", "department_head"],
    exams: ["super_admin", "school_admin", "department_head"],
    checkouts: ["super_admin", "school_admin", "librarian"],
  };

  const roles = roleMap[entity];
  if (!roles) {
    return NextResponse.json(
      { error: `Unknown export entity "${entity}". Valid: ${Object.keys(roleMap).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const authResult = await requireRoles(roles);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const schoolId = user.schoolId;
    const schoolWhere = schoolId ? { schoolId } : {};
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const classId = searchParams.get("classId") || "";
    const date = searchParams.get("date") || "";
    const examId = searchParams.get("examId") || "";
    const term = searchParams.get("term") || "";
    const academicYear = searchParams.get("academicYear") || "";

    let headers: string[] = [];
    let rows: (string | number | null | undefined)[][] = [];

    switch (entity) {
      case "students": {
        const where: Record<string, unknown> = { ...schoolWhere, deletedAt: null };
        if (status) where.status = status;
        if (search) {
          where.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { admissionNo: { contains: search } },
          ];
        }
        if (classId) where.enrollments = { some: { classId, status: "active" } };
        const students = await prisma.student.findMany({
          where,
          orderBy: { admissionNo: "asc" },
          include: { enrollments: { where: { status: "active" }, include: { class: { select: { name: true } } }, take: 1 } },
        });
        headers = ["Admission No", "First Name", "Last Name", "Gender", "Date of Birth", "Phone", "Email", "Guardian", "Guardian Phone", "Guardian Email", "Class", "Status"];
        rows = students.map((s: StudentRow) => [
          s.admissionNo,
          s.firstName,
          s.lastName,
          s.gender,
          s.dateOfBirth ? s.dateOfBirth.toISOString().slice(0, 10) : "",
          s.phone,
          s.email,
          s.guardianName,
          s.guardianPhone,
          s.guardianEmail,
          s.enrollments[0]?.class?.name ?? "",
          s.status,
        ]);
        break;
      }

      case "teachers": {
        const where: Record<string, unknown> = { ...schoolWhere, deletedAt: null };
        if (status) where.status = status;
        if (search) {
          where.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { employeeNo: { contains: search } },
          ];
        }
        const teachers = await prisma.teacher.findMany({ where, orderBy: { employeeNo: "asc" } });
        headers = ["Employee No", "First Name", "Last Name", "Gender", "Phone", "Email", "Qualification", "Specialization", "Status"];
        rows = teachers.map((t: TeacherRow) => [
          t.employeeNo,
          t.firstName,
          t.lastName,
          t.gender,
          t.phone,
          t.email,
          t.qualification,
          t.specialization,
          t.status,
        ]);
        break;
      }

      case "classes": {
        const where: Record<string, unknown> = { ...schoolWhere, deletedAt: null };
        if (academicYear) where.academicYear = academicYear;
        const classes = await prisma.class.findMany({
          where,
          orderBy: { name: "asc" },
          include: { _count: { select: { enrollments: true } } },
        });
        headers = ["Name", "Code", "Academic Year", "Capacity", "Enrollments"];
        rows = classes.map((c: ClassRow) => [c.name, c.code, c.academicYear, c.capacity, c._count.enrollments]);
        break;
      }

      case "attendance": {
        const where: Record<string, unknown> = { ...schoolWhere };
        if (classId) where.classId = classId;
        if (status) where.status = status;
        if (date) {
          const parsed = new Date(date);
          const nextDay = new Date(parsed);
          nextDay.setDate(nextDay.getDate() + 1);
          where.date = { gte: parsed, lt: nextDay };
        }
        const records = await prisma.attendance.findMany({
          where,
          orderBy: { date: "desc" },
          include: {
            student: { select: { admissionNo: true, firstName: true, lastName: true } },
            class: { select: { name: true, code: true } },
          },
        });
        headers = ["Date", "Admission No", "Student", "Class", "Status", "Remarks"];
        rows = records.map((r: AttendanceRow) => [
          r.date.toISOString().slice(0, 10),
          r.student.admissionNo,
          `${r.student.firstName} ${r.student.lastName}`,
          `${r.class.name} (${r.class.code})`,
          r.status,
          r.remarks,
        ]);
        break;
      }

      case "grades": {
        const where: Record<string, unknown> = { ...schoolWhere };
        if (classId) where.classId = classId;
        if (examId) where.examId = examId;
        const grades = await prisma.grade.findMany({
          where,
          orderBy: [{ createdAt: "desc" }],
          include: {
            student: { select: { admissionNo: true, firstName: true, lastName: true } },
            subject: { select: { name: true, code: true } },
            exam: { select: { name: true, term: true, academicYear: true } },
          },
        });
        headers = ["Admission No", "Student", "Subject", "Exam", "Term", "Year", "Score", "Grade", "Remarks"];
        rows = grades.map((g: GradeRow) => [
          g.student.admissionNo,
          `${g.student.firstName} ${g.student.lastName}`,
          g.subject.name,
          g.exam.name,
          g.exam.term,
          g.exam.academicYear,
          g.score,
          g.grade,
          g.remarks,
        ]);
        break;
      }

      case "fees": {
        const where: Record<string, unknown> = { ...schoolWhere };
        if (term) where.term = term;
        if (academicYear) where.academicYear = academicYear;
        const payments = await prisma.feePayment.findMany({
          where,
          orderBy: { paymentDate: "desc" },
          include: {
            student: { select: { admissionNo: true, firstName: true, lastName: true } },
            feeStructure: { select: { name: true } },
            user: { select: { name: true } },
          },
        });
        headers = ["Date", "Admission No", "Student", "Fee Structure", "Amount", "Method", "Reference", "Term", "Year", "Recorded By"];
        rows = payments.map((p: FeeRow) => [
          p.paymentDate.toISOString().slice(0, 10),
          p.student.admissionNo,
          `${p.student.firstName} ${p.student.lastName}`,
          p.feeStructure.name,
          p.amount,
          p.method,
          p.transactionRef,
          p.term,
          p.academicYear,
          p.user.name,
        ]);
        break;
      }

      case "books": {
        const where: Record<string, unknown> = { ...schoolWhere };
        if (search) {
          where.OR = [
            { title: { contains: search } },
            { author: { contains: search } },
            { isbn: { contains: search } },
          ];
        }
        const books = await prisma.libraryBook.findMany({ where, orderBy: { title: "asc" } });
        headers = ["Title", "Author", "ISBN", "Publisher", "Year", "Quantity", "Available", "Shelf", "Category"];
        rows = books.map((b: BookRow) => [b.title, b.author, b.isbn, b.publisher, b.year, b.quantity, b.available, b.shelf, b.category]);
        break;
      }

      case "apparatus": {
        const where: Record<string, unknown> = { ...schoolWhere };
        const items = await prisma.scienceApparatus.findMany({ where, orderBy: { name: "asc" } });
        headers = ["Name", "Category", "Total", "Available", "Broken", "Lost", "Description"];
        rows = items.map((a: ApparatusRow) => [a.name, a.category, a.totalQuantity, a.available, a.broken, a.lost, a.description]);
        break;
      }

      case "announcements": {
        const where: Record<string, unknown> = { ...schoolWhere };
        const announcements = await prisma.announcement.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        });
        headers = ["Date", "Title", "Priority", "Target", "Author"];
        rows = announcements.map((a: AnnouncementRow) => [
          a.createdAt.toISOString().slice(0, 10),
          a.title,
          a.priority,
          a.target,
          a.author.name,
        ]);
        break;
      }

      case "exams": {
        const where: Record<string, unknown> = { ...schoolWhere };
        if (academicYear) where.academicYear = academicYear;
        if (term) where.term = term;
        const exams = await prisma.exam.findMany({ where, orderBy: { startDate: "desc" } });
        headers = ["Name", "Term", "Academic Year", "Start Date", "End Date", "Description"];
        rows = exams.map((e: ExamRow) => [
          e.name,
          e.term,
          e.academicYear,
          e.startDate.toISOString().slice(0, 10),
          e.endDate.toISOString().slice(0, 10),
          e.description,
        ]);
        break;
      }

      case "checkouts": {
        const where: Record<string, unknown> = { ...schoolWhere };
        if (status) where.status = status;
        const checkouts = await prisma.bookCheckout.findMany({
          where,
          orderBy: { checkoutDate: "desc" },
          include: { book: { select: { title: true, author: true } } },
        });
        headers = ["Checkout Date", "Due Date", "Return Date", "Book", "Admission No", "Student", "Status"];
        rows = checkouts.map((c: CheckoutRow) => [
          c.checkoutDate.toISOString().slice(0, 10),
          c.dueDate.toISOString().slice(0, 10),
          c.returnDate ? c.returnDate.toISOString().slice(0, 10) : "",
          c.book.title,
          c.admissionNo,
          c.studentName,
          c.status,
        ]);
        break;
      }
    }

    audit.export(entity, user.id, user.schoolId ?? undefined);

    const csv = toCsv(headers, rows);
    const filename = `${entity}-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
