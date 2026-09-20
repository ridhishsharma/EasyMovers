import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { CrmUserManagementError, inviteCrmUser, officeUserWhere } from "@/lib/crm-user-management";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.CRM_USER_READ);
  if (!access.authorized) {
    return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  }

  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  if (search.length > 100) {
    return reply({ success: false, error: { code: "INVALID_SEARCH", message: "Search cannot exceed 100 characters." } }, 400);
  }

  try {
    const [users, roles] = await prisma.$transaction([
      prisma.user.findMany({
        where: officeUserWhere(search),
        orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
        take: 100,
        select: {
          id: true, fullName: true, email: true, mobile: true, role: true, isActive: true,
          emailVerified: true, mobileVerified: true, lastLogin: true, createdAt: true,
          crmRoleAssignments: {
            where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
            select: { assignedAt: true, expiresAt: true, role: { select: { code: true, name: true } } },
          },
        },
      }),
      prisma.crmRole.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { code: true, name: true, description: true, isSystem: true },
      }),
    ]);
    return reply({ success: true, data: { users, roles, currentUserId: access.userId } });
  } catch {
    return reply({ success: false, error: { code: "CRM_USERS_UNAVAILABLE", message: "Office users are temporarily unavailable." } }, 503);
  }
}

export async function POST(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.CRM_USER_MANAGE);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  const systemAccess = await authorizeCrmPermission(request, CRM_PERMISSIONS.SYSTEM_MANAGE);
  try {
    const body = await request.json();
    const user = await inviteCrmUser({
      actorUserId: access.userId, actorCanManageSystem: systemAccess.authorized,
      fullName: body?.fullName, email: body?.email, mobile: body?.mobile, roleCodes: body?.roleCodes,
      origin: new URL(request.url).origin,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    return reply({ success: true, data: { user } }, 201);
  } catch (error) {
    if (error instanceof CrmUserManagementError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    return reply({ success: false, error: { code: "CRM_USER_INVITATION_FAILED", message: "Unable to create the office user." } }, 503);
  }
}
