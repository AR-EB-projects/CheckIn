import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { createAuditLog, getClientIp } from "@/lib/audit";

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

    await prisma.folderItem.delete({ where: { id: itemId } });

    await createAuditLog(
      "FOLDER_ITEM_REMOVED",
      "FolderItem",
      itemId,
      { folderId, mediaFileId: item.mediaFileId },
      { mediaFileId: item.mediaFileId, ipAddress: getClientIp(request) ?? undefined }
    );

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete folder item error:", error);
    return NextResponse.json(
      { error: "Грешка при премахване на видеото от папката" },
      { status: 500 }
    );
  }
}
