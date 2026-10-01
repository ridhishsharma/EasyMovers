import { VendorOperatorPresenceState } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeVendorPortal } from "@/lib/vendor-portal-auth";
import { heartbeatOperatorAvailability, setOperatorAvailability, VendorPortalError } from "@/lib/vendor-portal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    const access = await authorizeVendorPortal(request);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    const body = await request.json() as Record<string, unknown>;
    if (!Object.values(VendorOperatorPresenceState).includes(body.state as VendorOperatorPresenceState))
      return reply({ success: false, error: { code: "INVALID_AVAILABILITY_STATE", message: "Choose Online, Paused, Busy or Offline." } }, 400);
    const data = await setOperatorAvailability(access.userId, access.vendorId, {
      state: body.state as VendorOperatorPresenceState,
      latitude: typeof body.latitude === "number" ? body.latitude : undefined,
      longitude: typeof body.longitude === "number" ? body.longitude : undefined,
    });
    return reply({ success: true, data });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid request body." } }, 400);
    if (error instanceof VendorPortalError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_AVAILABILITY_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_AVAILABILITY_FAILED", message: `Unable to update availability. Reference: ${reference}` } }, 503);
  }
}

export async function PUT(request: Request) {
  try {
    const access = await authorizeVendorPortal(request);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    const body = await request.json() as Record<string, unknown>;
    const data = await heartbeatOperatorAvailability(access.userId, access.vendorId, Number(body.latitude), Number(body.longitude));
    return reply({ success: true, data });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid request body." } }, 400);
    if (error instanceof VendorPortalError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_HEARTBEAT_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_HEARTBEAT_FAILED", message: `Unable to refresh availability. Reference: ${reference}` } }, 503);
  }
}
