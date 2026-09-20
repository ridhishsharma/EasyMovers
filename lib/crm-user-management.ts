import { Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export class CrmUserManagementError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export function officeUserWhere(search = ""): Prisma.UserWhereInput {
  return {
    OR: [
      { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      { crmRoleAssignments: { some: {} } },
    ],
    ...(search
      ? {
          AND: [{
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { mobile: { contains: search } },
            ],
          }],
        }
      : {}),
  };
}

function normalizeOfficeUserInput(input: {
  fullName: unknown; email: unknown; mobile: unknown; roleCodes: unknown;
}) {
  const fullName = typeof input.fullName === "string" ? input.fullName.trim().replace(/\s+/g, " ") : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const mobile = typeof input.mobile === "string" ? input.mobile.replace(/\D/g, "") : "";
  const roleCodes = Array.isArray(input.roleCodes)
    ? [...new Set(input.roleCodes.map(value => typeof value === "string" ? value.trim().toUpperCase() : ""))]
    : [];

  if (fullName.length < 2 || fullName.length > 100 || !/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(fullName)) {
    throw new CrmUserManagementError("INVALID_FULL_NAME", "Enter a valid employee name using letters.", 400);
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CrmUserManagementError("INVALID_EMAIL", "Enter a valid official email address.", 400);
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    throw new CrmUserManagementError("INVALID_MOBILE", "Enter a valid 10-digit Indian mobile number.", 400);
  }
  if (!roleCodes.length || roleCodes.length > 10 || roleCodes.some(code => !/^[A-Z][A-Z0-9_]{1,49}$/.test(code))) {
    throw new CrmUserManagementError("INVALID_CRM_ROLES", "Select at least one valid CRM role.", 400);
  }
  return { fullName, email, mobile, roleCodes };
}

export async function inviteCrmUser(input: {
  actorUserId: string; actorCanManageSystem: boolean; fullName: unknown; email: unknown;
  mobile: unknown; roleCodes: unknown; origin: string; ipAddress?: string;
}) {
  const normalized = normalizeOfficeUserInput(input);
  if (normalized.roleCodes.includes("SUPER_ADMIN") && !input.actorCanManageSystem) {
    throw new CrmUserManagementError("SYSTEM_PERMISSION_REQUIRED", "Only a Super Administrator can create another Super Administrator.", 403);
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new CrmUserManagementError("OFFICE_INVITATION_NOT_CONFIGURED", "Secure office invitations are not configured.", 503);
  }

  const [duplicate, roles] = await Promise.all([
    prisma.user.findFirst({ where: { OR: [{ email: normalized.email }, { mobile: normalized.mobile }] }, select: { id: true } }),
    prisma.crmRole.findMany({ where: { code: { in: normalized.roleCodes }, isActive: true }, select: { id: true, code: true } }),
  ]);
  if (duplicate) throw new CrmUserManagementError("CRM_USER_ALREADY_EXISTS", "An account already uses this email address or mobile number.", 409);
  if (roles.length !== normalized.roleCodes.length) throw new CrmUserManagementError("INVALID_CRM_ROLES", "One or more CRM roles are unavailable.", 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const redirectTo = `${input.origin}/admin/login?mode=recovery&returnTo=%2Fadmin`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(normalized.email, {
    redirectTo,
    data: { full_name: normalized.fullName, easymovers_office_invitation: true },
  });
  if (error || !data.user) {
    throw new CrmUserManagementError("OFFICE_INVITATION_FAILED", "The secure invitation could not be sent. Confirm that the email is not already registered.", 502);
  }

  try {
    return await prisma.$transaction(async transaction => {
      const user = await transaction.user.create({
        data: {
          supabaseAuthId: data.user.id, email: normalized.email, mobile: normalized.mobile,
          passwordHash: "SUPABASE_AUTH_MANAGED", fullName: normalized.fullName, role: "ADMIN",
          isActive: true, emailVerified: false, mobileVerified: false,
        },
        select: { id: true, fullName: true, email: true, mobile: true, isActive: true },
      });
      await transaction.userCrmRole.createMany({
        data: roles.map(role => ({ id: crypto.randomUUID(), userId: user.id, roleId: role.id, assignedByUserId: input.actorUserId })),
      });
      await transaction.crmAuditLog.create({
        data: {
          actorUserId: input.actorUserId, action: "CRM_USER_INVITED", entityType: "User", entityId: user.id,
          ipAddress: input.ipAddress, metadata: { email: normalized.email, roleCodes: normalized.roleCodes },
        },
      });
      return { ...user, roleCodes: normalized.roleCodes, invitationSent: true };
    });
  } catch (error) {
    await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new CrmUserManagementError("CRM_USER_ALREADY_EXISTS", "An account already uses this email address or mobile number.", 409);
    }
    throw error;
  }
}

export async function updateCrmUser(input: {
  actorUserId: string;
  targetUserId: string;
  isActive: unknown;
  roleCodes: unknown;
  ipAddress?: string;
  actorCanManageSystem: boolean;
}) {
  if (input.actorUserId === input.targetUserId && input.isActive === false) {
    throw new CrmUserManagementError(
      "SELF_DEACTIVATION_NOT_ALLOWED",
      "You cannot deactivate your own office account.",
      409
    );
  }

  if (input.isActive !== undefined && typeof input.isActive !== "boolean") {
    throw new CrmUserManagementError("INVALID_ACTIVE_STATUS", "isActive must be true or false.", 400);
  }
  const nextIsActive = typeof input.isActive === "boolean" ? input.isActive : undefined;

  if (!Array.isArray(input.roleCodes) || input.roleCodes.length === 0 || input.roleCodes.length > 10) {
    throw new CrmUserManagementError("INVALID_CRM_ROLES", "Select at least one valid CRM role.", 400);
  }

  const roleCodes = [...new Set(input.roleCodes.map(value =>
    typeof value === "string" ? value.trim().toUpperCase() : ""
  ))];
  if (roleCodes.some(code => !/^[A-Z][A-Z0-9_]{1,49}$/.test(code))) {
    throw new CrmUserManagementError("INVALID_CRM_ROLES", "One or more CRM roles are invalid.", 400);
  }

  return prisma.$transaction(async transaction => {
    const [target, roles] = await Promise.all([
      transaction.user.findUnique({
        where: { id: input.targetUserId },
        select: { id: true, fullName: true, isActive: true },
      }),
      transaction.crmRole.findMany({
        where: { code: { in: roleCodes }, isActive: true },
        select: { id: true, code: true },
      }),
    ]);

    if (!target) {
      throw new CrmUserManagementError("CRM_USER_NOT_FOUND", "The office user was not found.", 404);
    }
    if (roles.length !== roleCodes.length) {
      throw new CrmUserManagementError("INVALID_CRM_ROLES", "One or more CRM roles are unavailable.", 400);
    }

    const existing = await transaction.userCrmRole.findMany({
      where: { userId: target.id },
      select: { id: true, roleId: true, revokedAt: true, role: { select: { code: true } } },
    });
    const now = new Date();
    const currentlySuperAdministrator = existing.some(assignment =>
      !assignment.revokedAt && assignment.role.code === "SUPER_ADMIN"
    );
    const willBeSuperAdministrator = roleCodes.includes("SUPER_ADMIN");

    if ((currentlySuperAdministrator || willBeSuperAdministrator) && !input.actorCanManageSystem) {
      throw new CrmUserManagementError(
        "SYSTEM_PERMISSION_REQUIRED",
        "Only a Super Administrator can change Super Administrator access.",
        403
      );
    }

    if (currentlySuperAdministrator && (!willBeSuperAdministrator || nextIsActive === false)) {
      const remaining = await transaction.userCrmRole.count({
        where: {
          userId: { not: target.id }, revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          user: { isActive: true }, role: { code: "SUPER_ADMIN", isActive: true },
        },
      });
      if (remaining === 0) {
        throw new CrmUserManagementError(
          "LAST_SUPER_ADMIN_REQUIRED",
          "At least one active Super Administrator must remain.",
          409
        );
      }
    }
    const wantedRoleIds = new Set(roles.map(role => role.id));

    for (const assignment of existing) {
      if (wantedRoleIds.has(assignment.roleId)) {
        await transaction.userCrmRole.update({
          where: { id: assignment.id },
          data: { revokedAt: null, revokedByUserId: null, assignedByUserId: input.actorUserId, assignedAt: now },
        });
      } else if (!assignment.revokedAt) {
        await transaction.userCrmRole.update({
          where: { id: assignment.id },
          data: { revokedAt: now, revokedByUserId: input.actorUserId },
        });
      }
    }

    const existingRoleIds = new Set(existing.map(assignment => assignment.roleId));
    for (const role of roles) {
      if (!existingRoleIds.has(role.id)) {
        await transaction.userCrmRole.create({
          data: {
            id: crypto.randomUUID(),
            userId: target.id,
            roleId: role.id,
            assignedByUserId: input.actorUserId,
          },
        });
      }
    }

    if (nextIsActive !== undefined && nextIsActive !== target.isActive) {
      await transaction.user.update({ where: { id: target.id }, data: { isActive: nextIsActive } });
    }

    await transaction.crmAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "CRM_USER_ACCESS_UPDATED",
        entityType: "User",
        entityId: target.id,
        ipAddress: input.ipAddress,
        metadata: { isActive: nextIsActive ?? target.isActive, roleCodes },
      },
    });

    return { id: target.id, fullName: target.fullName, isActive: nextIsActive ?? target.isActive, roleCodes };
  });
}
