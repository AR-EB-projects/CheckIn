-- Drop old opt-out table and create new opt-in table
DROP TABLE IF EXISTS "training_opt_outs";

CREATE TABLE "training_opt_ins" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainingDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_opt_ins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "training_opt_ins_memberId_trainingDate_key" ON "training_opt_ins"("memberId", "trainingDate");
CREATE INDEX "training_opt_ins_trainingDate_idx" ON "training_opt_ins"("trainingDate");

ALTER TABLE "training_opt_ins" ADD CONSTRAINT "training_opt_ins_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
