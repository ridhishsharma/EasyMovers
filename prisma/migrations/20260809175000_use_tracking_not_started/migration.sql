-- Use the committed TrackingStatus enum value
ALTER TABLE "public"."BookingTracking"
ALTER COLUMN "trackingStatus"
SET DEFAULT 'NOT_STARTED';

ALTER TABLE "public"."Booking"
ALTER COLUMN "trackingStatus"
SET DEFAULT 'NOT_STARTED';