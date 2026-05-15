import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

const BASE_PROMPT = `You are omixsystems AI — the intelligent assistant for the omixsystems School Management System. You can help with school-related tasks like generating reports, answering questions about education, analyzing student data, and assisting with administrative work.

Guidelines:
- Be concise and professional
- When discussing data, use the actual numbers provided in context
- If you don't have enough data to answer accurately, say so clearly
- Do NOT reveal user passwords or sensitive credentials
- For report generation requests, ask what data they'd like included`;

async function buildSystemPrompt(role: string, schoolId: string | null, userId: string): Promise<string> {
  const base = `${BASE_PROMPT}\n\nUser Role: ${role}`;

  if (role === "super_admin") {
    const [schoolCount, userCount, activeSchools] = await Promise.all([
      prisma.school.count(),
      prisma.user.count(),
      prisma.school.count({ where: { isActive: true } }),
    ]);

    return `${base}
Your Role: System Super Administrator
Scope: All schools across the platform

Platform Overview:
- Total Schools: ${schoolCount}
- Active Schools: ${activeSchools}
- Total Users: ${userCount}

You can help with:
- Platform-wide analytics and insights
- School management guidance
- System administration advice
- Cross-school reports and comparisons`;
  }

  if (!schoolId) return base;

  // School-level users (school_admin, teacher)
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      name: true,
      slug: true,
      _count: { select: { students: true, teachers: true, classes: true } },
    },
  });

  if (!school) return base;

  const schoolContext = `
School: ${school.name} (${school.slug})
Students: ${school._count.students}
Teachers: ${school._count.teachers}
Classes: ${school._count.classes}`;

  if (role === "school_admin") {
    return `${base}
${schoolContext}
Your Role: School Administrator

You can help with:
- Student performance analysis and grade reports
- Fee collection summaries and financial insights
- Teacher workload and class distribution
- Announcement drafting
- Timetable management
- Exam scheduling and results analysis`;
  }

  if (role === "teacher") {
    // Find the teacher record linked to this user
    const teacherRecord = await prisma.teacher.findFirst({
      where: { schoolId },
      select: {
        firstName: true,
        lastName: true,
        specialization: true,
        _count: { select: { classes: true, subjects: true } },
      },
    });

    const teacherContext = teacherRecord
      ? `\nYour Profile: ${teacherRecord.firstName} ${teacherRecord.lastName}
Specialization: ${teacherRecord.specialization || "General"}
Classes Assigned: ${teacherRecord._count.classes}
Subjects Taught: ${teacherRecord._count.subjects}`
      : "";

    return `${base}
${schoolContext}${teacherContext}
Your Role: Teacher

You can help with:
- Lesson planning and teaching resources
- Student grade entry and progress tracking
- Class performance analysis
- Timetable and schedule questions
- Student behavior and academic guidance`;
  }

  return base;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = chatSchema.parse(body);

    const role = (session.user as any).role || "school_admin";
    const schoolId = (session.user as any).schoolId || null;
    const systemPrompt = await buildSystemPrompt(role, schoolId, session.user.id);

    const apiKey = process.env.OPENCODE_ZEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenCode Zen API key is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://opencode.ai/zen/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "nemotron-3-super-free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI service returned an error", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse =
      data.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({
      reply: aiResponse,
      model: data.model || "openai/gpt-4o-mini",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { error: "Failed to process AI chat request" },
      { status: 500 }
    );
  }
}
