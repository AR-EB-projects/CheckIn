import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardCode: string }> }
) {
  const { cardCode } = await params;

  // Verify admin session
  const cookieHeader = request.headers.get("cookie");
  const cookies = cookieHeader ? Object.fromEntries(cookieHeader.split("; ").map(c => c.split("="))) : {};
  const token = cookies["admin_session"];

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const member = await prisma.member.findFirst({
        where: {
          card: {
            cardCode: cardCode
          }
        }
      });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: { visitsUsed: 0 },
    });

    return NextResponse.json({
      id: updatedMember.id,
      name: `${updatedMember.firstName} ${updatedMember.secondName}`,
      visits_total: updatedMember.visitsTotal,
      visits_used: updatedMember.visitsUsed
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
