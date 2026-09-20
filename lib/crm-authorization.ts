import { resolveApplicationAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const CRM_PERMISSIONS = {
  DASHBOARD_READ: "dashboard.read",
  CRM_USER_READ: "crm_user.read",
  CRM_USER_MANAGE: "crm_user.manage",
  VENDOR_APPLICATION_READ: "vendor_application.read",
  VENDOR_APPLICATION_REVIEW: "vendor_application.review",
  VENDOR_APPLICATION_APPROVE: "vendor_application.approve",
  VENDOR_READ: "vendor.read",
  VENDOR_MANAGE: "vendor.manage",
  VENDOR_ACTIVATE: "vendor.activate",
  SERVICE_LOCATION_READ: "service_location.read",
  SERVICE_LOCATION_MANAGE: "service_location.manage",
  SERVICE_LOCATION_ACTIVATE: "service_location.activate",
  BOOKING_READ: "booking.read",
  BOOKING_MANAGE: "booking.manage",
  BOOKING_ASSIGN: "booking.assign",
  PAYMENT_READ: "payment.read",
  PAYMENT_MANAGE: "payment.manage",
  REFUND_APPROVE: "refund.approve",
  BILLING_READ: "billing.read",
  BILLING_MANAGE: "billing.manage",
  REPORT_READ: "report.read",
  AUDIT_READ: "audit.read",
  SYSTEM_MANAGE: "system.manage",
} as const;

export type CrmPermission = (typeof CRM_PERMISSIONS)[keyof typeof CRM_PERMISSIONS];

export type CrmAuthorization =
  | { authorized: true; userId: string; roles: string[]; permission: CrmPermission }
  | {
      authorized: false;
      status: 401 | 403;
      code: "UNAUTHENTICATED" | "CRM_PERMISSION_REQUIRED";
      message: string;
    };

export async function authorizeCrmPermission(
  request: Request,
  permission: CrmPermission
): Promise<CrmAuthorization> {
  const authentication = await resolveApplicationAuthentication(request);

  if (!authentication.authenticated || !authentication.userId) {
    return {
      authorized: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Sign in with your linked EasyMovers office account.",
    };
  }

  const legacyRoles = authentication.roles ?? [];

  // The platform owner cannot be locked out by a damaged role assignment.
  if (legacyRoles.includes("SUPER_ADMIN")) {
    return {
      authorized: true,
      userId: authentication.userId,
      roles: legacyRoles,
      permission,
    };
  }

  const assignment = await prisma.userCrmRole.findFirst({
    where: {
      userId: authentication.userId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      role: {
        isActive: true,
        permissions: {
          some: {
            permission: { code: permission, isActive: true },
          },
        },
      },
    },
    select: { role: { select: { code: true } } },
  });

  if (!assignment) {
    return {
      authorized: false,
      status: 403,
      code: "CRM_PERMISSION_REQUIRED",
      message: "Your EasyMovers office account does not have permission for this action.",
    };
  }

  return {
    authorized: true,
    userId: authentication.userId,
    roles: [assignment.role.code],
    permission,
  };
}
