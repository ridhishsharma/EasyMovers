-- Link existing application users to verified Supabase Auth identities.
-- Existing users remain unlinked until explicitly provisioned.
ALTER TABLE "public"."User"
ADD COLUMN "supabaseAuthId" UUID;

CREATE UNIQUE INDEX "User_supabaseAuthId_key"
ON "public"."User"("supabaseAuthId");