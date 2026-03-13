import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("admin_session")?.value;
  const { id } = await params;

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: { cards: { orderBy: { createdAt: "desc" } } },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Member fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("admin_session")?.value;
  const { id } = await params;

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const firstName = String(body.firstName ?? "").trim();
    const secondName = String(body.secondName ?? "").trim();
    const visitsTotal = Number(body.visitsTotal);
    const visitsUsed = Number(body.visitsUsed);

    if (!firstName) {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(visitsTotal) || visitsTotal < 0) {
      return NextResponse.json(
        { error: "visitsTotal must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(visitsUsed) || visitsUsed < 0) {
      return NextResponse.json(
        { error: "visitsUsed must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (visitsUsed > visitsTotal) {
      return NextResponse.json(
        { error: "visitsUsed cannot be greater than visitsTotal" },
        { status: 400 }
      );
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        firstName,
        secondName,
        visitsTotal,
        visitsUsed,
      },
      include: { cards: { orderBy: { createdAt: "desc" } } },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Member update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("admin_session")?.value;
  const { id } = await params;

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = String((body as { action?: unknown })?.action ?? "").trim();

    if (action !== "assign_new_card") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const memberExists = await prisma.member.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!memberExists) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    let updatedMember = null;
    let lastError: unknown = null;

    for (let i = 0; i < 5; i++) {
      const cardCode = randomBytes(4).toString("hex").toUpperCase();
      try {
        updatedMember = await prisma.$transaction(async (tx) => {
          await tx.card.updateMany({
            where: { memberId: id },
            data: { isActive: false },
          });

          await tx.card.create({
            data: {
              memberId: id,
              cardCode,
              isActive: true,
            },
          });

          return tx.member.findUnique({
            where: { id },
            include: { cards: { orderBy: { createdAt: "desc" } } },
          });
        });
        break;
      } catch (error) {
        lastError = error;
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code?: unknown }).code)
            : "";
        if (code !== "P2002") {
          throw error;
        }
      }
    }

    if (!updatedMember) {
      throw lastError ?? new Error("Failed to generate unique card code");
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Assign new card error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = request.cookies.get("admin_session")?.value;
    const { id } = await params;

    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Manually delete the cards first since we don't have onDelete: Cascade
        // The error P2003 was because of the foreign key constraint.
        await prisma.card.deleteMany({
            where: { memberId: id },
        });

        // Now delete the member
        await prisma.member.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Member and associated cards deleted successfully" });
    } catch (error) {
        console.error("Member deletion error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
