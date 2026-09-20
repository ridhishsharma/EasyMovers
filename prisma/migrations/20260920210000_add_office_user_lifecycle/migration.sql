ALTER TABLE "public"."User"
ADD COLUMN "officeInvitedAt" TIMESTAMP(3),
ADD COLUMN "officeInvitationAcceptedAt" TIMESTAMP(3),
ADD COLUMN "officePasswordSetAt" TIMESTAMP(3),
ADD COLUMN "officeFirstLoginAt" TIMESTAMP(3),
ADD COLUMN "officeLastLogoutAt" TIMESTAMP(3);

UPDATE "public"."User"
SET "officeInvitedAt" = "createdAt"
WHERE "supabaseAuthId" IS NOT NULL
  AND ("role" IN ('ADMIN', 'SUPER_ADMIN') OR EXISTS (
    SELECT 1 FROM "public"."UserCrmRole" assignment WHERE assignment."userId" = "User"."id"
  ));
