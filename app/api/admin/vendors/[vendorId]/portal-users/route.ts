import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { inviteVendorPortalAccount, listVendorPortalAccounts, resendVendorPortalActivation, VendorPortalAccountError } from "@/lib/vendor-portal-accounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, context: { params: Promise<{ vendorId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { vendorId } = await context.params;
    return reply({ success: true, data: { users: await listVendorPortalAccounts(vendorId) } });
  } catch (error) {
    if (error instanceof VendorPortalAccountError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    return reply({ success: false, error: { code: "VENDOR_USERS_UNAVAILABLE", message: "Vendor portal users are temporarily unavailable." } }, 503);
  }
}

export async function POST(request: Request, context: { params: Promise<{ vendorId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_MANAGE);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { vendorId } = await context.params;
    const body = await request.json();
    const user = await inviteVendorPortalAccount({
      vendorId,
      actorUserId: access.userId,
      fullName: body?.fullName,
      email: body?.email,
      mobile: body?.mobile,
      origin: new URL(request.url).origin,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    return reply({ success: true, data: { user } }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid request body." } }, 400);
    if (error instanceof VendorPortalAccountError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    return reply({ success: false, error: { code: "VENDOR_INVITATION_FAILED", message: "Unable to create the vendor portal user." } }, 503);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ vendorId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_MANAGE);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { vendorId } = await context.params;
    const body = await request.json();
    if (body?.action !== "RESEND_ACTIVATION" || typeof body?.userId !== "string")
      return reply({ success: false, error: { code: "INVALID_VENDOR_PORTAL_ACTION", message: "Choose a valid portal access action." } }, 400);
    const result = await resendVendorPortalActivation({
      vendorId,
      userId: body.userId,
      actorUserId: access.userId,
      origin: new URL(request.url).origin,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    return reply({ success: true, data: result });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid request body." } }, 400);
    if (error instanceof VendorPortalAccountError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    return reply({ success: false, error: { code: "VENDOR_ACTIVATION_RESEND_FAILED", message: "Unable to resend the vendor activation link." } }, 503);
  }
}
