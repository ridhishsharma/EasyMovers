import { NextResponse } from "next/server";
import { authorizeVendorPortal } from "@/lib/vendor-portal-auth";
import { setQuotationEnquiries, VendorPortalError } from "@/lib/vendor-portal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    const access = await authorizeVendorPortal(request);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.accepting !== "boolean")
      return reply({ success: false, error: { code: "INVALID_ENQUIRY_PREFERENCE", message: "Choose whether quotation enquiries are being accepted." } }, 400);
    let pausedUntil: Date | null = null;
    if (!body.accepting && body.pausedUntil) {
      pausedUntil = new Date(String(body.pausedUntil));
      if (!Number.isFinite(pausedUntil.getTime()) || pausedUntil <= new Date())
        return reply({ success: false, error: { code: "INVALID_PAUSE_TIME", message: "Pause-until must be a future date and time." } }, 400);
    }
    const data = await setQuotationEnquiries(access.userId, access.vendorId, body.accepting, pausedUntil);
    return reply({ success: true, data });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid request body." } }, 400);
    if (error instanceof VendorPortalError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_ENQUIRY_PREFERENCE_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_ENQUIRY_PREFERENCE_FAILED", message: `Unable to update enquiry preference. Reference: ${reference}` } }, 503);
  }
}
