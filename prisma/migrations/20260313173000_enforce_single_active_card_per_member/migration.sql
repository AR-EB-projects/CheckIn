-- Normalize existing data: keep at most one active card per member (latest by createdAt)
WITH ranked_active AS (
  SELECT
    id,
    "memberId",
    ROW_NUMBER() OVER (
      PARTITION BY "memberId"
      ORDER BY "createdAt" DESC, id DESC
    ) AS rn
  FROM "cards"
  WHERE "isActive" = true
)
UPDATE "cards" c
SET "isActive" = false
FROM ranked_active ra
WHERE c.id = ra.id
  AND ra.rn > 1;

-- Enforce: only one active card per member
CREATE UNIQUE INDEX "cards_memberId_active_unique"
ON "cards"("memberId")
WHERE "isActive" = true;
