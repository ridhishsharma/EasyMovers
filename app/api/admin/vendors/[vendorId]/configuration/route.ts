import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { replaceVendorServiceConfiguration, VendorOperationsError } from "@/lib/vendor-operational-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function PUT(request: Request, context: { params: Promise<{ vendorId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_MANAGE);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { vendorId } = await context.params;
    const result = await replaceVendorServiceConfiguration(vendorId, await request.json(), access.userId, request.headers.get("x-forwarded-for")?.split(",")[0]?.trim());
    return reply({ success: true, data: result });
  } catch (error) {
    if (error instanceof VendorOperationsError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    return reply({ success: false, error: { code: "VENDOR_CONFIGURATION_FAILED", message: "Vendor service configuration could not be saved." } }, 503);
  }
}
