import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { getReceivedChunks } from "@/lib/media/storage";
import { CHUNK_SIZE } from "@/lib/media/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploadId = request.nextUrl.searchParams.get("uploadId")?.trim();
  if (!uploadId) {
    return NextResponse.json(
      { error: "uploadId is required" },
      { status: 400 }
    );
  }

  try {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { uploadId },
      select: { id: true, status: true, sizeBytes: true },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: "Upload session not found" },
        { status: 404 }
      );
    }

    const receivedChunks = await getReceivedChunks(uploadId);
    const totalChunks = Math.ceil(Number(mediaFile.sizeBytes) / CHUNK_SIZE);

    return NextResponse.json({
      uploadId,
      mediaFileId: mediaFile.id,
      status: mediaFile.status,
      receivedChunks,
      totalChunks,
      complete: receivedChunks.length >= totalChunks,
    });
  } catch (error) {
    console.error("Upload status error:", error);
    return NextResponse.json(
      { error: "Грешка при проверка на статуса" },
      { status: 500 }
    );
  }
}