import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/local-rate-limit";
import { requireAuth } from "@/lib/auth-helper";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
];

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    // Rate limit: 20 uploads per hour per user
    const rateLimit = await checkRateLimit(`upload:${user.id}`, 20, 3600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Upload quota exceeded. Try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "document";
    const meetingId = (formData.get("meetingId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 400 }
      );
    }

    // Create upload directory
    const schoolId = user.schoolId || "unknown";
    const uploadPath = path.join(UPLOAD_DIR, schoolId);
    await fs.mkdir(uploadPath, { recursive: true });

    // Generate safe filename — sanitize to prevent path traversal
    const ext = path.extname(file.name);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filePath = path.join(uploadPath, safeName);

    // Write file
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    // If meetingId provided, create a MeetingRecording entry
    let recording = null;
    if (meetingId) {
      const isVoice = file.type.startsWith("audio/");
      recording = await prisma.meetingRecording.create({
        data: {
          meetingId,
          type: isVoice ? "voice" : type === "image" ? "photo" : "document",
          fileUrl: `/uploads/${schoolId}/${safeName}`,
          fileSize: file.size,
          duration: null,
          uploadedById: user.id,
          schoolId: user.schoolId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      fileUrl: `/uploads/${schoolId}/${safeName}`,
      fileName: safeName,
      fileSize: file.size,
      fileType: file.type,
      recording,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
