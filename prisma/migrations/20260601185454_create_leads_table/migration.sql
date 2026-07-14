-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "pickupCity" TEXT,
    "destinationCity" TEXT,
    "shiftingType" TEXT,
    "propertyType" TEXT,
    "pickupFloor" TEXT,
    "liftAvailable" TEXT,
    "packingRequired" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_referenceId_key" ON "Lead"("referenceId");
