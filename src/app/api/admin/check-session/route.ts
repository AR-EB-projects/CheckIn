import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = cookieHeader ? Object.fromEntries(cookieHeader.split("; ").map(c => c.split("="))) : {};
  const token = cookies["admin_session"];

  if (!token) {
    return NextResponse.json({ isAdmin: false, role: null });
  }

  const payload = await verifyAdminToken(token);
  const role = typeof payload?.role === "string" ? payload.role : null;
  return NextResponse.json({ isAdmin: !!payload, role });
}
