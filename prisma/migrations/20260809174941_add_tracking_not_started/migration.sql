-- AlterEnum
ALTER TYPE "public"."TrackingStatus" ADD VALUE 'NOT_STARTED';

-- AlterTable
ALTER TABLE "public"."BookingTracking" ALTER COLUMN "trackingStatus" SET DEFAULT 'NOT_STARTED';
