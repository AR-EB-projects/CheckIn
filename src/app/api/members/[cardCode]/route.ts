import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardCode: string }> }
) {
  const { cardCode } = await params;
  try {
    const member = await prisma.member.findFirst({
      where: {
        card: {
          cardCode: cardCode
        }
      },
      include: {
        card: true
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Auto-activate card on first access if it's inactive
    if (member.card && !member.card.isActive) {
      await prisma.card.update({
        where: { id: member.card.id },
        data: { isActive: true }
      });
      // Update the local member object to reflect the change for the response
      member.card.isActive = true;
    }

    return NextResponse.json({
        id: member.id,
        cardCode: member.card?.cardCode,
        name: `${member.firstName} ${member.secondName}`,
        visits_total: member.visitsTotal,
        visits_used: member.visitsUsed,
        isActive: member.card?.isActive
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
