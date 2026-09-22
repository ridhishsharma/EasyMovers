import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { ServiceLocationError, upsertLocationService } from "@/lib/service-location-management";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function PUT(request: Request, context: { params: Promise<{ locationId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_MANAGE);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { locationId } = await context.params;
    const service = await upsertLocationService(locationId, await request.json(), access.userId, request.headers.get("x-forwarded-for")?.split(",")[0]?.trim());
    return reply({ success: true, data: { service } });
  } catch (error) {
    if (error instanceof ServiceLocationError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    return reply({ success: false, error: { code: "LOCATION_SERVICE_UPDATE_FAILED", message: "The location service could not be updated." } }, 503);
  }
}
