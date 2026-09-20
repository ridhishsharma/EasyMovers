import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { CrmUserManagementError, updateCrmUser } from "@/lib/crm-user-management";

export const runtime = "nodejs";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.CRM_USER_MANAGE);
  if (!access.authorized) {
    return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  }
  const systemAccess = await authorizeCrmPermission(request, CRM_PERMISSIONS.SYSTEM_MANAGE);

  const { userId } = await context.params;
  if (!userId.trim() || userId.length > 100) {
    return reply({ success: false, error: { code: "INVALID_CRM_USER_ID", message: "A valid office user is required." } }, 400);
  }

  try {
    const body = await request.json();
    const user = await updateCrmUser({
      actorUserId: access.userId,
      targetUserId: userId,
      isActive: body?.isActive,
      roleCodes: body?.roleCodes,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      actorCanManageSystem: systemAccess.authorized,
    });
    return reply({ success: true, data: { user } });
  } catch (error) {
    if (error instanceof CrmUserManagementError) {
      return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    }
    return reply({ success: false, error: { code: "CRM_USER_UPDATE_FAILED", message: "Unable to update the office user." } }, 503);
  }
}
