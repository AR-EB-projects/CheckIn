-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "broadcast" BOOLEAN NOT NULL DEFAULT false,
    "memberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "url" TEXT,
    "trainingDate" TEXT,
    "trainerMessage" TEXT,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_notifications_status_sendAt_idx" ON "scheduled_notifications"("status", "sendAt");
