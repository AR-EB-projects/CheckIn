import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { deleteFile, deleteChunkDir } from "@/lib/media/storage";
import { killProcessingFor } from "@/lib/media/processing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: folderId, itemId } = await params;

  try {
    const item = await prisma.folderItem.findUnique({
      where: { id: itemId },
      select: { id: true, folderId: true, mediaFileId: true },
    });

    if (!item || item.folderId !== folderId) {
      return NextResponse.json(
        { error: "Елементът не е намерен в тази папка" },
        { status: 404 }
      );
    }

    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: item.mediaFileId },
      select: {
        id: true,
        status: true,
        diskFileName: true,
        originalName: true,
        displayName: true,
        uploadId: true,
        _count: { select: { folderItems: true } },
      },
    });

    if (!mediaFile) {
      await prisma.folderItem.delete({ where: { id: itemId } });
      return NextResponse.json({ deleted: true, mode: "reference_removed" });
    }

    if (mediaFile._count.folderItems > 1) {
      await prisma.folderItem.delete({ where: { id: itemId } });

      return NextResponse.json({ deleted: true, mode: "reference_removed" });
    }

    if (mediaFile.status === "UPLOADING" && mediaFile.uploadId) {
      await deleteChunkDir(mediaFile.uploadId);
    }

    if (mediaFile.status === "PROCESSING") {
      killProcessingFor(mediaFile.id);
      const outputName = `${mediaFile.id}.mp4`;
      if (outputName !== mediaFile.diskFileName) {
        await deleteFile(outputName);
      }
    }

    await deleteFile(mediaFile.diskFileName);
    await prisma.mediaFile.delete({ where: { id: mediaFile.id } });

    return NextResponse.json({ deleted: true, mode: "file_deleted" });
  } catch (error) {
    console.error("Delete folder item error:", error);
    return NextResponse.json(
      { error: "Грешка при премахване на видеото от папката" },
      { status: 500 }
    );
  }
}
