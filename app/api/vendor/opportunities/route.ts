import { NextResponse } from "next/server";
import { authorizeVendorPortal } from "@/lib/vendor-portal-auth";
import { listVendorOpportunities, VendorOpportunityError } from "@/lib/vendor-opportunities";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const access = await authorizeVendorPortal(request);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    return reply({ success: true, data: { opportunities: await listVendorOpportunities(access.vendorId) } });
  } catch (error) {
    if (error instanceof VendorOpportunityError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_OPPORTUNITIES_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_OPPORTUNITIES_FAILED", message: `Unable to load quotation enquiries. Reference: ${reference}` } }, 503);
  }
}
