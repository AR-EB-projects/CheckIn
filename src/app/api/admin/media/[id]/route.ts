import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { deleteFile, deleteChunkDir } from "@/lib/media/storage";
import { killProcessingFor } from "@/lib/media/processing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const file = await prisma.mediaFile.findUnique({
      where: { id },
      include: {
        folderItems: {
          include: {
            folder: { select: { id: true, name: true } },
          },
        },
        shareItems: {
          include: {
            shareLink: { select: { id: true, name: true, token: true, expiresAt: true } },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Файлът не е намерен" }, { status: 404 });
    }

    return NextResponse.json({
      ...file,
      sizeBytes: Number(file.sizeBytes),
    });
  } catch (error) {
    console.error("Get media error:", error);
    return NextResponse.json(
      { error: "Грешка при зареждане на файла" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    const changes: Record<string, unknown> = {};

    if (typeof body.displayName === "string") {
      const name = body.displayName.trim();
      if (!name) {
        return NextResponse.json(
          { error: "Името не може да е празно" },
          { status: 400 }
        );
      }
      data.displayName = name;
      changes.displayName = name;
    }

    if (typeof body.isVisible === "boolean") {
      data.isVisible = body.isVisible;
      changes.isVisible = body.isVisible;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Няма данни за обновяване" },
        { status: 400 }
      );
    }

    const existing = await prisma.mediaFile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Файлът не е намерен" }, { status: 404 });
    }

    const updated = await prisma.mediaFile.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...updated,
      sizeBytes: Number(updated.sizeBytes),
    });
  } catch (error) {
    console.error("Update media error:", error);
    return NextResponse.json(
      { error: "Грешка при обновяване на файла" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const file = await prisma.mediaFile.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        diskFileName: true,
        originalName: true,
        displayName: true,
        uploadId: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Файлът не е намерен" }, { status: 404 });
    }

    // Handle state-specific cleanup
    if (file.status === "UPLOADING" && file.uploadId) {
      await deleteChunkDir(file.uploadId);
    }

    if (file.status === "PROCESSING") {
      killProcessingFor(file.id);
      // Delete potential partial output
      const outputName = `${file.id}.mp4`;
      if (outputName !== file.diskFileName) {
        await deleteFile(outputName);
      }
    }

    // Delete physical file
    await deleteFile(file.diskFileName);

    // Cascade deletes FolderItems and ShareLinkItems via Prisma relations
    await prisma.mediaFile.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json(
      { error: "Грешка при изтриване на файла" },
      { status: 500 }
    );
  }
}
