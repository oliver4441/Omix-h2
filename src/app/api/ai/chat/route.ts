import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-helper";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

const BASE_PROMPT = `You are omixsystems AI — the intelligent assistant for the omixsystems School Management System. You can help with school-related tasks like generating reports, answering questions about education, analyzing student data, and assisting with administrative work.

Guidelines:
- Be concise and professional
- When discussing data, use only what the user provides in their message
- If you don't have enough data to answer accurately, say so clearly
- Do NOT reveal user passwords, student PII, or sensitive credentials
- Do NOT include specific student counts, teacher counts, or financial figures unless explicitly provided by the user
- For report generation requests, ask what data they'd like included`;

function buildSystemPrompt(role: string): string {
  const base = `${BASE_PROMPT}\n\nUser Role: ${role}`;

  switch (role) {
    case "super_admin":
      return `${base}
Your Role: System Super Administrator
Scope: All schools across the platform
You can help with platform-wide analytics, school management guidance, system administration, and cross-school reports.`;

    case "school_admin":
      return `${base}
Your Role: School Administrator (Principal)
You have oversight of all departments. You can help with academic performance, library, science lab, bursar/finance, board management, student enrollment, attendance, and grades.`;

    case "teacher":
      return `${base}
Your Role: Teacher
You can help with lesson planning, grade entry, class performance analysis, timetables, and student guidance.`;

    case "bursar":
      return `${base}
Your Role: Bursar / Finance Officer
You can help with fee collection, payment tracking, financial reporting, and fee structure management.`;

    case "librarian":
      return `${base}
Your Role: Librarian
You can help with book catalog management, checkouts, inventory, and overdue tracking.`;

    case "lab_technician":
      return `${base}
Your Role: Science Lab Technician
You can help with apparatus inventory, lab maintenance, equipment checkout, and activity planning.`;

    case "department_head":
      return `${base}
Your Role: Department Head
You can help with departmental performance, subject analytics, teacher coordination, and academic planning.`;

    case "board_member":
      return `${base}
Your Role: Board Member
You can help with meeting schedules, minutes, governance, and school policy.`;

    default:
      return base;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { message } = chatSchema.parse(body);

    const role = user.role || "school_admin";
    const systemPrompt = buildSystemPrompt(role);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXTAUTH_URL || "https://omix-h2.onrender.com",
          "X-Title": "omixsystems SMS",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-super-free",
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
      model: data.model || "nvidia/nemotron-3-super-free",
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
