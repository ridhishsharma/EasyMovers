-- Evidence may be checked from an original document without storing a public URL.
ALTER TABLE "public"."VendorDocument"
  ALTER COLUMN "fileName" DROP NOT NULL,
  ALTER COLUMN "fileUrl" DROP NOT NULL;
