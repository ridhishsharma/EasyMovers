import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { getVendorOperationalReadiness, VendorOperationsError } from "@/lib/vendor-operational-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, context: { params: Promise<{ vendorId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { vendorId } = await context.params;
    const data = await getVendorOperationalReadiness(vendorId);
    const [manageAccess, activateAccess] = await Promise.all([
      authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_MANAGE),
      authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_ACTIVATE),
    ]);
    return reply({ success: true, data: { ...data, capabilities: { canManage: manageAccess.authorized, canActivate: activateAccess.authorized } } });
  } catch (error) {
    if (error instanceof VendorOperationsError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    return reply({ success: false, error: { code: "VENDOR_OPERATIONS_UNAVAILABLE", message: "Vendor operational readiness is temporarily unavailable." } }, 503);
  }
}
