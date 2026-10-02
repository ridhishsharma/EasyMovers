import { NextResponse } from "next/server";
import { authorizeVendorPortal } from "@/lib/vendor-portal-auth";
import { reviseVendorOpportunityQuotation, submitVendorOpportunityQuotation, VendorOpportunityError } from "@/lib/vendor-opportunities";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const access = await authorizeVendorPortal(request);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { bookingId } = await context.params;
    const result = await submitVendorOpportunityQuotation({
      vendorId: access.vendorId,
      userId: access.userId,
      bookingId,
      body: await request.json(),
      requestId: request.headers.get("x-request-id")?.trim() || crypto.randomUUID(),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    });
    return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store", ...(result.headers || {}) } });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid quotation request." } }, 400);
    if (error instanceof VendorOpportunityError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_QUOTATION_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_QUOTATION_FAILED", message: `Unable to submit the quotation. Reference: ${reference}` } }, 503);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const access = await authorizeVendorPortal(request);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { bookingId } = await context.params;
    const data = await reviseVendorOpportunityQuotation({
      vendorId: access.vendorId,
      userId: access.userId,
      bookingId,
      body: await request.json(),
      requestId: request.headers.get("x-request-id")?.trim() || crypto.randomUUID(),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    });
    return reply({ success: true, data });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid quotation request." } }, 400);
    if (error instanceof VendorOpportunityError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_QUOTATION_REVISION_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_QUOTATION_REVISION_FAILED", message: `Unable to revise the quotation. Reference: ${reference}` } }, 503);
  }
}
