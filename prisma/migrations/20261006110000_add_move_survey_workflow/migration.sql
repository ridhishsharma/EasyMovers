CREATE TYPE "public"."MoveSurveyStatus" AS ENUM ('REQUESTED','ASSIGNED','SCHEDULED','IN_PROGRESS','REPORT_SUBMITTED','REVIEW_PENDING','APPROVED','SHARED','RETURNED_FOR_CORRECTION','RESCHEDULED','CANCELLED','NO_SHOW');
CREATE TYPE "public"."MoveSurveyMode" AS ENUM ('CUSTOMER_SELF','VIDEO','PHYSICAL','TELEPHONE');
CREATE TYPE "public"."MoveSurveyMediaType" AS ENUM ('PHOTO','VIDEO','DOCUMENT');

CREATE TABLE "public"."MoveSurvey" (
  "id" TEXT NOT NULL,
  "surveyNumber" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "inventoryId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "public"."MoveSurveyStatus" NOT NULL DEFAULT 'REQUESTED',
  "mode" "public"."MoveSurveyMode" NOT NULL DEFAULT 'CUSTOMER_SELF',
  "assignedToUserId" TEXT,
  "assignedToVendorId" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "sharedAt" TIMESTAMP(3),
  "customerConfirmedAt" TIMESTAMP(3),
  "customerConfirmation" TEXT,
  "customerSessionRef" TEXT,
  "reportRemarks" TEXT,
  "reviewRemarks" TEXT,
  "aiEstimateJson" JSONB,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MoveSurvey_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."MoveSurveyRoom" (
  "id" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "roomName" TEXT NOT NULL,
  "estimatedBoxes" INTEGER NOT NULL DEFAULT 0,
  "estimatedWeightKg" DECIMAL(10,2),
  "estimatedVolumeCft" DECIMAL(10,2),
  "fragileItems" INTEGER NOT NULL DEFAULT 0,
  "remarks" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "aiEstimateJson" JSONB,
  "confirmedByCustomer" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MoveSurveyRoom_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."MoveSurveyMedia" (
  "id" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "roomId" TEXT,
  "mediaType" "public"."MoveSurveyMediaType" NOT NULL DEFAULT 'PHOTO',
  "objectKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "caption" TEXT,
  "uploadedByType" TEXT NOT NULL,
  "uploadedById" TEXT,
  "aiAnalysisJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MoveSurveyMedia_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MoveSurvey_surveyNumber_key" ON "public"."MoveSurvey"("surveyNumber");
CREATE UNIQUE INDEX "MoveSurvey_leadId_version_key" ON "public"."MoveSurvey"("leadId","version");
CREATE INDEX "MoveSurvey_leadId_status_idx" ON "public"."MoveSurvey"("leadId","status");
CREATE INDEX "MoveSurvey_assignedToUserId_status_idx" ON "public"."MoveSurvey"("assignedToUserId","status");
CREATE INDEX "MoveSurvey_assignedToVendorId_status_idx" ON "public"."MoveSurvey"("assignedToVendorId","status");
CREATE INDEX "MoveSurvey_scheduledAt_idx" ON "public"."MoveSurvey"("scheduledAt");
CREATE UNIQUE INDEX "MoveSurveyRoom_surveyId_roomName_key" ON "public"."MoveSurveyRoom"("surveyId","roomName");
CREATE INDEX "MoveSurveyRoom_surveyId_sortOrder_idx" ON "public"."MoveSurveyRoom"("surveyId","sortOrder");
CREATE INDEX "MoveSurveyMedia_surveyId_createdAt_idx" ON "public"."MoveSurveyMedia"("surveyId","createdAt");
CREATE INDEX "MoveSurveyMedia_roomId_idx" ON "public"."MoveSurveyMedia"("roomId");
ALTER TABLE "public"."MoveSurvey" ADD CONSTRAINT "MoveSurvey_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."MoveSurvey" ADD CONSTRAINT "MoveSurvey_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."MoveSurveyRoom" ADD CONSTRAINT "MoveSurveyRoom_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "public"."MoveSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."MoveSurveyMedia" ADD CONSTRAINT "MoveSurveyMedia_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "public"."MoveSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."MoveSurveyMedia" ADD CONSTRAINT "MoveSurveyMedia_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."MoveSurveyRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."MoveSurveyRoom" ADD CONSTRAINT "MoveSurveyRoom_non_negative_estimates_check" CHECK ("estimatedBoxes" >= 0 AND "fragileItems" >= 0 AND ("estimatedWeightKg" IS NULL OR "estimatedWeightKg" >= 0) AND ("estimatedVolumeCft" IS NULL OR "estimatedVolumeCft" >= 0));
ALTER TABLE "public"."MoveSurveyMedia" ADD CONSTRAINT "MoveSurveyMedia_file_size_check" CHECK ("fileSize" > 0 AND "fileSize" <= 2097152);
