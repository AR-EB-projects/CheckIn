import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { uploadImageBuffer } from "@/lib/media/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB

async function assignToFolder(mediaFileId: string, folderId: string): Promise<string | null> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return null;

  const lastItem = await prisma.folderItem.findFirst({
    where: { folderId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  try {
    const item = await prisma.folderItem.create({
      data: {
        folderId,
        mediaFileId,
        sortOrder: (lastItem?.sortOrder ?? -1) + 1,
      },
    });
    return item.id;
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
      return null;
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderIdRaw = formData.get("folderId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Полето 'file' е задължително" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Само изображения са позволени" },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Изображението не може да надвишава 20 MB" },
        { status: 413 }
      );
    }

    const folderId = folderIdRaw ? String(folderIdRaw).trim() : null;
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) {
        return NextResponse.json({ error: "Папката не е намерена" }, { status: 404 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mediaFileId = randomUUID();

    const { publicId, secureUrl, bytes } = await uploadImageBuffer(buffer, mediaFileId);

    const displayName = file.name.replace(/\.[^.]+$/, "");

    await prisma.mediaFile.create({
      data: {
        id: mediaFileId,
        originalName: file.name,
        displayName,
        diskFileName: `cloudinary:${mediaFileId}`,
        mimeType: "image/webp",
        sizeBytes: BigInt(bytes),
        status: "READY",
        isVisible: true,
        cloudinaryPublicId: publicId,
        cloudinaryUrl: secureUrl,
      },
    });

    let folderItemId: string | null = null;
    if (folderId) {
      folderItemId = await assignToFolder(mediaFileId, folderId);
    }

    return NextResponse.json(
      { mediaFileId, status: "READY", cloudinaryUrl: secureUrl, folderId, folderItemId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Грешка при качване на изображението" },
      { status: 500 }
    );
  }
}
