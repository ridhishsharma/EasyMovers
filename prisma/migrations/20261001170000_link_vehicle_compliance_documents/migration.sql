-- Link RC, insurance and permit evidence to the exact vendor vehicle.
ALTER TABLE "public"."VendorDocument"
ADD COLUMN "vehicleId" TEXT;

CREATE INDEX "VendorDocument_vehicleId_idx"
ON "public"."VendorDocument"("vehicleId");

ALTER TABLE "public"."VendorDocument"
ADD CONSTRAINT "VendorDocument_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "public"."VendorVehicle"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "VendorDocument_active_vehicle_type_key"
ON "public"."VendorDocument"("vehicleId", "documentType")
WHERE "vehicleId" IS NOT NULL AND "isActive" = true;
