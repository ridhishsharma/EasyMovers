import { NextResponse } from "next/server";
import { checkOrigin, readDraftSession } from "@/lib/enquiry-session";
import { CustomerBookingConfirmationError, prepareCustomerBookingConfirmation } from "@/lib/customer-booking-confirmation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    checkOrigin(request);
    const body = await request.json() as Record<string, unknown>;
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    if (!/^EM-[A-Z0-9-]{6,80}$/i.test(reference)) return reply({ success: false, message: "Enter a valid customer reference." }, 400);
    const session = readDraftSession(request, reference);
    if (!session) return reply({ success: false, verificationRequired: true, message: "Verify the registered mobile before confirming this booking." }, 401);
    const data = await prepareCustomerBookingConfirmation(session.id, reference, requestId);
    return reply({ success: true, data, message: "Booking details confirmed. Your secure advance payment is ready." });
  } catch (error) {
    if (error instanceof CustomerBookingConfirmationError) return reply({ success: false, code: error.code, message: error.message }, error.status);
    if (error instanceof SyntaxError) return reply({ success: false, message: "Provide a valid booking confirmation." }, 400);
    if (error instanceof Error && error.message === "Invalid origin") return reply({ success: false, message: "Booking confirmation was blocked for security." }, 403);
    console.error(`[CUSTOMER_BOOKING_CONFIRMATION_FAILED:${requestId}]`, error);
    return reply({ success: false, message: `Unable to prepare booking confirmation. Reference: ${requestId}` }, 503);
  }
}
