import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: folderId } = await params;

  try {
    const body = await request.json();
    const mediaFileId = String(body.mediaFileId ?? "").trim();
    const displayName = body.displayName
      ? String(body.displayName).trim()
      : null;

    if (!mediaFileId) {
      return NextResponse.json(
        { error: "mediaFileId е задължително" },
        { status: 400 }
      );
    }

    const [folder, mediaFile] = await Promise.all([
      prisma.folder.findUnique({ where: { id: folderId } }),
      prisma.mediaFile.findUnique({ where: { id: mediaFileId } }),
    ]);

    if (!folder) {
      return NextResponse.json({ error: "Папката не е намерена" }, { status: 404 });
    }

    if (!mediaFile) {
      return NextResponse.json({ error: "Файлът не е намерен" }, { status: 404 });
    }

    // Get the next sort order
    const lastItem = await prisma.folderItem.findFirst({
      where: { folderId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const item = await prisma.folderItem.create({
      data: {
        folderId,
        mediaFileId,
        displayName,
        sortOrder: (lastItem?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation (duplicate reference)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Видеото вече е добавено в тази папка" },
        { status: 409 }
      );
    }
    console.error("Add folder item error:", error);
    return NextResponse.json(
      { error: "Грешка при добавяне на видео в папката" },
      { status: 500 }
    );
  }
}
