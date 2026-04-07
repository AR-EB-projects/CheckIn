import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Deep-copy a folder tree. Duplicates folder structure and FolderItem references only.
 * Physical files are never copied — new FolderItems point to the same MediaFile IDs.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const targetParentId = body.targetParentId
      ? String(body.targetParentId).trim()
      : null;

    const source = await prisma.folder.findUnique({
      where: { id },
      include: {
        items: true,
        children: {
          include: {
            items: true,
            children: {
              include: {
                items: true,
                children: { include: { items: true } },
              },
            },
          },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Папката не е намерена" }, { status: 404 });
    }

    if (targetParentId) {
      const parent = await prisma.folder.findUnique({
        where: { id: targetParentId },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Целевата папка не е намерена" },
          { status: 404 }
        );
      }
      // Prevent copying into itself or its descendants
      if (targetParentId === id) {
        return NextResponse.json(
          { error: "Не може да копирате папка в себе си" },
          { status: 400 }
        );
      }
    }

    // Recursive copy within a transaction
    const newRoot = await prisma.$transaction(async (tx) => {
      return await copyFolderRecursive(tx, source, targetParentId);
    });

    return NextResponse.json(newRoot, { status: 201 });
  } catch (error) {
    console.error("Copy folder error:", error);
    return NextResponse.json(
      { error: "Грешка при копиране на папката" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function copyFolderRecursive(tx: any, source: any, parentId: string | null): Promise<any> {
  const newFolder = await tx.folder.create({
    data: {
      name: `${source.name} (копие)`,
      parentId,
    },
  });

  // Copy item references (not physical files)
  if (source.items?.length > 0) {
    await tx.folderItem.createMany({
      data: source.items.map((item: { mediaFileId: string; displayName: string | null; sortOrder: number }) => ({
        folderId: newFolder.id,
        mediaFileId: item.mediaFileId,
        displayName: item.displayName,
        sortOrder: item.sortOrder,
      })),
      skipDuplicates: true,
    });
  }

  // Recurse into children
  if (source.children?.length > 0) {
    for (const child of source.children) {
      await copyFolderRecursive(tx, child, newFolder.id);
    }
  }

  return newFolder;
}
