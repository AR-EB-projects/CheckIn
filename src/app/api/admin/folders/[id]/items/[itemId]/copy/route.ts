import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sourceFolderId, itemId } = await params;

  try {
    const body = await request.json();
    const targetFolderId = String(body.targetFolderId ?? "").trim();

    if (!targetFolderId) {
      return NextResponse.json(
        { error: "targetFolderId е задължително" },
        { status: 400 }
      );
    }

    const [sourceItem, targetFolder] = await Promise.all([
      prisma.folderItem.findUnique({
        where: { id: itemId },
        select: { id: true, folderId: true, mediaFileId: true, displayName: true },
      }),
      prisma.folder.findUnique({ where: { id: targetFolderId } }),
    ]);

    if (!sourceItem || sourceItem.folderId !== sourceFolderId) {
      return NextResponse.json(
        { error: "Елементът не е намерен в тази папка" },
        { status: 404 }
      );
    }

    if (!targetFolder) {
      return NextResponse.json(
        { error: "Целевата папка не е намерена" },
        { status: 404 }
      );
    }

    // Get next sort order in target folder
    const lastItem = await prisma.folderItem.findFirst({
      where: { folderId: targetFolderId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const newItem = await prisma.folderItem.create({
      data: {
        folderId: targetFolderId,
        mediaFileId: sourceItem.mediaFileId,
        displayName: sourceItem.displayName,
        sortOrder: (lastItem?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Видеото вече съществува в целевата папка" },
        { status: 409 }
      );
    }
    console.error("Copy folder item error:", error);
    return NextResponse.json(
      { error: "Грешка при копиране на видеото" },
      { status: 500 }
    );
  }
}
