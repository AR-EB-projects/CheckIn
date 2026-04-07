import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { createAuditLog, getClientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parentId = request.nextUrl.searchParams.get("parentId") || null;

    const folders = await prisma.folder.findMany({
      where: { parentId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { children: true, items: true },
        },
      },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("List folders error:", error);
    return NextResponse.json(
      { error: "Грешка при зареждане на папките" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const parentId = body.parentId ? String(body.parentId).trim() : null;

    if (!name) {
      return NextResponse.json(
        { error: "Името на папката е задължително" },
        { status: 400 }
      );
    }

    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { error: "Родителската папка не е намерена" },
          { status: 404 }
        );
      }
    }

    const folder = await prisma.folder.create({
      data: { name, parentId },
    });

    await createAuditLog(
      "FOLDER_CREATED",
      "Folder",
      folder.id,
      { name, parentId },
      { ipAddress: getClientIp(request) ?? undefined }
    );

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: "Грешка при създаване на папка" },
      { status: 500 }
    );
  }
}
