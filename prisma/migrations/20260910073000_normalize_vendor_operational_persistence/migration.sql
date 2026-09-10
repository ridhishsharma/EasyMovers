-- CreateEnum
CREATE TYPE "public"."VendorServiceScope" AS ENUM ('WITHIN_CITY', 'WITHIN_STATE', 'PAN_INDIA');

-- CreateEnum
CREATE TYPE "public"."VendorServiceType" AS ENUM ('HOUSEHOLD_RELOCATION', 'OFFICE_RELOCATION', 'CORPORATE_RELOCATION', 'VEHICLE_TRANSPORT', 'COMMERCIAL_GOODS', 'WAREHOUSING', 'PACKING_ONLY', 'LOADING_UNLOADING', 'INSTALLATION_UNINSTALLATION');

-- CreateEnum
CREATE TYPE "public"."VendorPricingType" AS ENUM ('FIXED', 'PER_KILOMETRE', 'PER_ITEM', 'PER_KILOGRAM', 'CUSTOM_QUOTATION');

-- AlterTable
ALTER TABLE "public"."Vendor" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."VendorServiceArea" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "scope" "public"."VendorServiceScope" NOT NULL,
    "originCity" TEXT,
    "originState" TEXT,
    "destinationCity" TEXT,
    "destinationState" TEXT,
    "serviceablePostalCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorServiceOffering" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceType" "public"."VendorServiceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorServiceOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorPricing" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceType" "public"."VendorServiceType" NOT NULL,
    "pricingType" "public"."VendorPricingType" NOT NULL,
    "basePrice" DECIMAL(12,2),
    "minimumPrice" DECIMAL(12,2),
    "pricePerKilometre" DECIMAL(12,2),
    "pricePerKilogram" DECIMAL(12,2),
    "pricePerItem" DECIMAL(12,2),
    "labourCharge" DECIMAL(12,2),
    "packingCharge" DECIMAL(12,2),
    "loadingCharge" DECIMAL(12,2),
    "unloadingCharge" DECIMAL(12,2),
    "insuranceChargePercentage" DECIMAL(5,2),
    "taxPercentage" DECIMAL(5,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorServiceArea_vendorId_idx" ON "public"."VendorServiceArea"("vendorId");

-- CreateIndex
CREATE INDEX "VendorServiceArea_scope_idx" ON "public"."VendorServiceArea"("scope");

-- CreateIndex
CREATE INDEX "VendorServiceArea_originCity_idx" ON "public"."VendorServiceArea"("originCity");

-- CreateIndex
CREATE INDEX "VendorServiceArea_originState_idx" ON "public"."VendorServiceArea"("originState");

-- CreateIndex
CREATE INDEX "VendorServiceArea_destinationCity_idx" ON "public"."VendorServiceArea"("destinationCity");

-- CreateIndex
CREATE INDEX "VendorServiceArea_destinationState_idx" ON "public"."VendorServiceArea"("destinationState");

-- CreateIndex
CREATE INDEX "VendorServiceArea_active_idx" ON "public"."VendorServiceArea"("active");

-- CreateIndex
CREATE INDEX "VendorServiceOffering_vendorId_idx" ON "public"."VendorServiceOffering"("vendorId");

-- CreateIndex
CREATE INDEX "VendorServiceOffering_serviceType_idx" ON "public"."VendorServiceOffering"("serviceType");

-- CreateIndex
CREATE INDEX "VendorServiceOffering_active_idx" ON "public"."VendorServiceOffering"("active");

-- CreateIndex
CREATE UNIQUE INDEX "VendorServiceOffering_vendorId_serviceType_key" ON "public"."VendorServiceOffering"("vendorId", "serviceType");

-- CreateIndex
CREATE INDEX "VendorPricing_vendorId_idx" ON "public"."VendorPricing"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPricing_serviceType_idx" ON "public"."VendorPricing"("serviceType");

-- CreateIndex
CREATE INDEX "VendorPricing_pricingType_idx" ON "public"."VendorPricing"("pricingType");

-- CreateIndex
CREATE INDEX "VendorPricing_active_idx" ON "public"."VendorPricing"("active");

-- CreateIndex
CREATE INDEX "VendorPricing_effectiveFrom_idx" ON "public"."VendorPricing"("effectiveFrom");

-- CreateIndex
CREATE INDEX "VendorPricing_effectiveUntil_idx" ON "public"."VendorPricing"("effectiveUntil");

-- CreateIndex
CREATE INDEX "Vendor_deletedAt_idx" ON "public"."Vendor"("deletedAt");

-- AddForeignKey
ALTER TABLE "public"."VendorServiceArea" ADD CONSTRAINT "VendorServiceArea_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorServiceOffering" ADD CONSTRAINT "VendorServiceOffering_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorPricing" ADD CONSTRAINT "VendorPricing_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Backfill normalized Vendor service areas from legacy Vendor.serviceCities.
WITH "NormalizedVendorCities" AS (
    SELECT
        vendor."id",
        vendor."city",
        vendor."state",
        vendor."status",
        vendor."createdAt",
        vendor."updatedAt",
        array_remove(
            regexp_split_to_array(
                COALESCE(
                    vendor."serviceCities",
                    ''
                ),
                '\s*,\s*'
            ),
            ''
        ) AS "serviceCities"
    FROM "public"."Vendor" AS vendor
),
"EffectiveVendorCities" AS (
    SELECT
        vendor.*,
        CASE
            WHEN cardinality(
                vendor."serviceCities"
            ) > 0
            THEN vendor."serviceCities"

            WHEN NULLIF(
                BTRIM(
                    vendor."city"
                ),
                ''
            ) IS NOT NULL
            THEN ARRAY[
                BTRIM(
                    vendor."city"
                )
            ]

            ELSE ARRAY[]::TEXT[]
        END AS "effectiveCities"
    FROM "NormalizedVendorCities" AS vendor
)
INSERT INTO "public"."VendorServiceArea" (
    "id",
    "vendorId",
    "scope",
    "originCity",
    "originState",
    "destinationCity",
    "destinationState",
    "active",
    "createdAt",
    "updatedAt"
)
SELECT
    vendor."id" ||
        '-service-area-' ||
        city."position"::TEXT,

    vendor."id",

    (
        CASE
            WHEN cardinality(
                vendor."effectiveCities"
            ) > 1
            THEN 'WITHIN_STATE'
            ELSE 'WITHIN_CITY'
        END
    )::"public"."VendorServiceScope",

    CASE
        WHEN cardinality(
            vendor."effectiveCities"
        ) > 1
        THEN NULLIF(
            BTRIM(
                vendor."city"
            ),
            ''
        )
        ELSE city."name"
    END,

    NULLIF(
        BTRIM(
            vendor."state"
        ),
        ''
    ),

    city."name",

    CASE
        WHEN cardinality(
            vendor."effectiveCities"
        ) > 1
        THEN NULLIF(
            BTRIM(
                vendor."state"
            ),
            ''
        )
        ELSE NULL
    END,

    UPPER(
        COALESCE(
            vendor."status",
            ''
        )
    ) = 'ACTIVE',

    vendor."createdAt",
    vendor."updatedAt"

FROM "EffectiveVendorCities" AS vendor
CROSS JOIN LATERAL
    unnest(
        vendor."effectiveCities"
    ) WITH ORDINALITY
    AS city(
        "name",
        "position"
    )
ON CONFLICT ("id") DO NOTHING;


-- Backfill normalized service offerings from legacy Boolean service flags.
WITH "LegacyVendorServices" AS (
    SELECT
        vendor."id" AS "vendorId",
        vendor."status",
        vendor."createdAt",
        vendor."updatedAt",
        service."priority",
        service."serviceType",
        service."title"
    FROM "public"."Vendor" AS vendor
    CROSS JOIN LATERAL (
        VALUES
            (
                1,
                vendor."householdService",
                'HOUSEHOLD_RELOCATION',
                'Household Relocation'
            ),
            (
                2,
                vendor."officeService",
                'OFFICE_RELOCATION',
                'Office Relocation'
            ),
            (
                3,
                vendor."vehicleService",
                'VEHICLE_TRANSPORT',
                'Vehicle Transportation'
            )
    ) AS service(
        "priority",
        "enabled",
        "serviceType",
        "title"
    )
    WHERE service."enabled" = TRUE
),
"RankedVendorServices" AS (
    SELECT
        service.*,
        ROW_NUMBER() OVER (
            PARTITION BY service."vendorId"
            ORDER BY service."priority"
        ) AS "servicePosition"
    FROM "LegacyVendorServices" AS service
)
INSERT INTO "public"."VendorServiceOffering" (
    "id",
    "vendorId",
    "serviceType",
    "title",
    "active",
    "createdAt",
    "updatedAt"
)
SELECT
    service."vendorId" ||
        '-service-' ||
        service."servicePosition"::TEXT,

    service."vendorId",

    service."serviceType"::"public"."VendorServiceType",

    service."title",

    UPPER(
        COALESCE(
            service."status",
            ''
        )
    ) = 'ACTIVE',

    service."createdAt",
    service."updatedAt"

FROM "RankedVendorServices" AS service
ON CONFLICT (
    "vendorId",
    "serviceType"
) DO NOTHING;