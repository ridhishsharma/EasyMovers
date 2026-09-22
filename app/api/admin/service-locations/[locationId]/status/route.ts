import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { changeServiceLocationStatus, ServiceLocationError } from "@/lib/service-location-management";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, context: { params: Promise<{ locationId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_ACTIVATE);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { locationId } = await context.params;
    const result = await changeServiceLocationStatus(locationId, await request.json(), access.userId, request.headers.get("x-forwarded-for")?.split(",")[0]?.trim());
    return reply({ success: true, data: result });
  } catch (error) {
    if (error instanceof ServiceLocationError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    return reply({ success: false, error: { code: "SERVICE_LOCATION_STATUS_FAILED", message: "The service location status could not be changed." } }, 503);
  }
}
