import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/adminAuth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const token = request.cookies.get("admin_session")?.value;

    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { firstName, secondName, visitsTotal } = await request.json();
        const safeFirstName = String(firstName ?? "").trim();
        const safeSecondName = String(secondName ?? "").trim();

        if (!safeFirstName) {
            return NextResponse.json(
                { error: "First name is required" },
                { status: 400 }
            );
        }

        let newMember = null;
        let lastError: unknown = null;

        for (let i = 0; i < 5; i++) {
            const cardCode = randomBytes(4).toString("hex").toUpperCase();
            try {
                newMember = await prisma.member.create({
                    data: {
                        firstName: safeFirstName,
                        secondName: safeSecondName,
                        visitsTotal: visitsTotal || 0,
                        visitsUsed: 0,
                        cards: {
                            create: {
                                cardCode,
                                isActive: true,
                            },
                        },
                    },
                    include: {
                        cards: true,
                    },
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

        if (!newMember) {
            throw lastError ?? new Error("Failed to generate unique card code");
        }

        return NextResponse.json(newMember, { status: 201 });
    } catch (error) {
        console.error("Member creation error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const token = request.cookies.get("admin_session")?.value;

    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const members = await prisma.member.findMany({
            include: {
                cards: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
            orderBy: {
                firstName: "asc",
            },
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("Members fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
