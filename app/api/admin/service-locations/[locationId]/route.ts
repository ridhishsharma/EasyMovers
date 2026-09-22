import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { getServiceLocation, ServiceLocationError, updateServiceLocation } from "@/lib/service-location-management";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function failure(error: unknown) {
  return error instanceof ServiceLocationError
    ? reply({ success: false, error: { code: error.code, message: error.message } }, error.status)
    : reply({ success: false, error: { code: "SERVICE_LOCATION_OPERATION_FAILED", message: "The service location operation could not be completed." } }, 503);
}

export async function GET(request: Request, context: { params: Promise<{ locationId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { locationId } = await context.params;
    const [data, manageAccess, activateAccess] = await Promise.all([
      getServiceLocation(locationId),
      authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_MANAGE),
      authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_ACTIVATE),
    ]);
    return reply({ success: true, data: {
      ...data,
      capabilities: { canManage: manageAccess.authorized, canActivate: activateAccess.authorized },
    } });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: Request, context: { params: Promise<{ locationId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_MANAGE);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { locationId } = await context.params;
    const location = await updateServiceLocation(locationId, await request.json(), access.userId, request.headers.get("x-forwarded-for")?.split(",")[0]?.trim());
    return reply({ success: true, data: { location } });
  } catch (error) { return failure(error); }
}
