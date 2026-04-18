-- CreateEnum
CREATE TYPE "MemberGroup" AS ENUM ('AMATEURS', 'ADVANCED');

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "group" "MemberGroup";
