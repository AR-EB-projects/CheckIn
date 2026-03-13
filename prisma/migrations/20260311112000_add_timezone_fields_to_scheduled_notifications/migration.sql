-- AlterTable
ALTER TABLE "scheduled_notifications"
ADD COLUMN "sendAtLocal" TEXT,
ADD COLUMN "sendTimeZone" TEXT NOT NULL DEFAULT 'Europe/Sofia';
