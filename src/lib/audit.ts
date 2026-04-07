import { prisma } from "@/lib/db";

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>,
  options?: { mediaFileId?: string; ipAddress?: string }
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
        mediaFileId: options?.mediaFileId ?? null,
        ipAddress: options?.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const real = request.headers.get("x-real-ip");
  return real ?? null;
}