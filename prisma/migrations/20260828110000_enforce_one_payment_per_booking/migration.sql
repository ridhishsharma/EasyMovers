-- Replace the non-unique booking lookup index with one Payment per Booking.
DROP INDEX "public"."Payment_bookingId_idx";

CREATE UNIQUE INDEX "Payment_bookingId_key"
ON "public"."Payment"("bookingId");