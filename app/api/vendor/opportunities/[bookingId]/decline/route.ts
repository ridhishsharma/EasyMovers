import { NextResponse } from "next/server";
import { authorizeVendorPortal } from "@/lib/vendor-portal-auth";
import { declineVendorOpportunity, VendorOpportunityError } from "@/lib/vendor-opportunities";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const access = await authorizeVendorPortal(request);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const body = await request.json() as Record<string, unknown>;
    const { bookingId } = await context.params;
    const data = await declineVendorOpportunity({ vendorId: access.vendorId, bookingId, reason: typeof body.reason === "string" ? body.reason : "" });
    return reply({ success: true, data, message: "Quotation invitation declined." });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid decline request." } }, 400);
    if (error instanceof VendorOpportunityError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_OPPORTUNITY_DECLINE_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_OPPORTUNITY_DECLINE_FAILED", message: `Unable to decline the invitation. Reference: ${reference}` } }, 503);
  }
}
