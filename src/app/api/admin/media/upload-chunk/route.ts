import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { writeChunk } from "@/lib/media/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const uploadId = String(formData.get("uploadId") ?? "").trim();
    const chunkIndex = Number(formData.get("chunkIndex"));
    const chunk = formData.get("chunk");

    if (!uploadId) {
      return NextResponse.json(
        { error: "uploadId is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return NextResponse.json(
        { error: "Invalid chunkIndex" },
        { status: 400 }
      );
    }

    if (!(chunk instanceof Blob)) {
      return NextResponse.json(
        { error: "chunk must be a file/blob" },
        { status: 400 }
      );
    }

    // Verify upload session exists and is still in UPLOADING state
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { uploadId },
      select: { id: true, status: true },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: "Upload session not found" },
        { status: 404 }
      );
    }

    if (mediaFile.status !== "UPLOADING") {
      return NextResponse.json(
        { error: "Upload already finalized" },
        { status: 409 }
      );
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());
    await writeChunk(uploadId, chunkIndex, buffer);

    return NextResponse.json({ received: true, chunkIndex });
  } catch (error) {
    console.error("Upload chunk error:", error);
    return NextResponse.json(
      { error: "Грешка при качване на част от файла" },
      { status: 500 }
    );
  }
}