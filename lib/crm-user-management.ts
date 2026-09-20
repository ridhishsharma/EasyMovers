import { Prisma } from "@prisma/client";
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
