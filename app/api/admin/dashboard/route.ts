import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const ageInDays = (value: Date | null) => value
  ? Math.max(0, Math.floor((Date.now() - value.getTime()) / 86_400_000))
  : 0;

export async function GET(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.DASHBOARD_READ);
  if (!access.authorized) {
    return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  }

  try {
    const params = new URL(request.url).searchParams;
    const period = params.get("period") ?? "30";
    const periodDays = ["7", "30", "90"].includes(period) ? Number(period) : 30;
    const city = params.get("city")?.trim().slice(0, 100) ?? "";
    const state = params.get("state")?.trim().slice(0, 100) ?? "";
    const serviceType = params.get("serviceType")?.trim().toUpperCase().slice(0, 50) ?? "";
    const periodStart = new Date(Date.now() - periodDays * 86_400_000);
    const [user, assignments, allPermissions] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: access.userId },
        select: { id: true, fullName: true, email: true, lastLogin: true },
      }),
      prisma.userCrmRole.findMany({
        where: {
          userId: access.userId,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          role: { isActive: true },
        },
        select: {
          role: {
            select: {
              code: true,
              name: true,
              permissions: {
                where: { permission: { isActive: true } },
                select: { permission: { select: { code: true } } },
              },
            },
          },
        },
      }),
      prisma.crmPermission.findMany({ where: { isActive: true }, select: { code: true } }),
    ]);

    if (!user) return reply({ success: false, error: { code: "CRM_USER_NOT_FOUND", message: "Office user was not found." } }, 404);

    const permissionSet = new Set<string>(
      access.roles.includes("SUPER_ADMIN") ? allPermissions.map(item => item.code) : []
    );
    for (const assignment of assignments) {
      for (const item of assignment.role.permissions) permissionSet.add(item.permission.code);
    }
    const permissions = [...permissionSet].sort();
    const roles = assignments.map(item => ({ code: item.role.code, name: item.role.name }));

    const canSeeApplications = permissionSet.has(CRM_PERMISSIONS.VENDOR_APPLICATION_READ);
    const canSeeVendors = permissionSet.has(CRM_PERMISSIONS.VENDOR_READ);
    const canSeeUsers = permissionSet.has(CRM_PERMISSIONS.CRM_USER_READ);
    const canSeeLeads = permissionSet.has(CRM_PERMISSIONS.LEAD_READ);
    const canSeeServiceLocations = permissionSet.has(CRM_PERMISSIONS.SERVICE_LOCATION_READ);
    const staleBefore = new Date(Date.now() - 3 * 86_400_000);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const vendorFilter = {
      deletedAt: null,
      ...(city ? { serviceAreas: { some: { active: true, originCity: { equals: city, mode: "insensitive" as const } } } } : {}),
      ...(state ? { state: { equals: state, mode: "insensitive" as const } } : {}),
      ...(serviceType ? { serviceOfferings: { some: { active: true, serviceType: serviceType as never } } } : {}),
    };
    const leadPeriodFilter = {
      createdAt: { gte: periodStart },
      ...(city ? { pickupCity: { equals: city, mode: "insensitive" as const } } : {}),
      ...(state ? { pickupState: { equals: state, mode: "insensitive" as const } } : {}),
      ...(serviceType ? { shiftingType: { equals: serviceType, mode: "insensitive" as const } } : {}),
    };

    const [applicationGroups, oldestApplication, staleApplications, vendorGroups, cities, pendingInvitations, leadGroups, newLeadsToday, serviceLocationGroups, vendorsAdded, leadsInPeriod, topServices] = await Promise.all([
      canSeeApplications ? prisma.vendorApplication.groupBy({ by: ["status"], _count: { _all: true } }) : Promise.resolve([]),
      canSeeApplications ? prisma.vendorApplication.findFirst({
        where: { status: { in: ["PENDING", "UNDER_REVIEW", "NEEDS_INFORMATION"] } },
        orderBy: { createdAt: "asc" }, select: { createdAt: true },
      }) : Promise.resolve(null),
      canSeeApplications ? prisma.vendorApplication.count({
        where: { status: { in: ["PENDING", "UNDER_REVIEW", "NEEDS_INFORMATION"] }, createdAt: { lt: staleBefore } },
      }) : Promise.resolve(0),
      canSeeVendors ? prisma.vendor.groupBy({ by: ["status"], where: vendorFilter, _count: { _all: true } }) : Promise.resolve([]),
      canSeeVendors ? prisma.vendorServiceArea.findMany({
        where: { active: true, originCity: { not: null }, vendor: { deletedAt: null } },
        distinct: ["originCity"], select: { originCity: true },
      }) : Promise.resolve([]),
      canSeeUsers ? prisma.user.count({ where: { officeInvitedAt: { not: null }, officePasswordSetAt: null, isActive: true } }) : Promise.resolve(0),
      canSeeLeads ? prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }) : Promise.resolve([]),
      canSeeLeads ? prisma.lead.count({ where: { createdAt: { gte: today } } }) : Promise.resolve(0),
      canSeeServiceLocations ? prisma.serviceLocation.groupBy({ by: ["status"], _count: { _all: true } }) : Promise.resolve([]),
      canSeeVendors ? prisma.vendor.count({ where: { ...vendorFilter, createdAt: { gte: periodStart } } }) : Promise.resolve(0),
      canSeeLeads ? prisma.lead.count({ where: leadPeriodFilter }) : Promise.resolve(0),
      canSeeLeads ? prisma.lead.groupBy({ by: ["shiftingType"], where: { ...leadPeriodFilter, shiftingType: { not: null } }, _count: { _all: true }, orderBy: { _count: { shiftingType: "desc" } }, take: 5 }) : Promise.resolve([]),
    ]);

    return reply({ success: true, data: {
      user, roles, permissions,
      vendorApplications: canSeeApplications ? {
        counts: Object.fromEntries(applicationGroups.map(item => [item.status, item._count._all])),
        staleCount: staleApplications, oldestOpenAgeDays: ageInDays(oldestApplication?.createdAt ?? null),
      } : null,
      vendors: canSeeVendors ? {
        counts: Object.fromEntries(vendorGroups.map(item => [item.status, item._count._all])), activeCities: cities.length,
      } : null,
      officeUsers: canSeeUsers ? { pendingInvitations } : null,
      leads: canSeeLeads ? {
        counts: Object.fromEntries(leadGroups.map(item => [item.status, item._count._all])), newToday: newLeadsToday,
      } : null,
      serviceLocations: canSeeServiceLocations ? {
        counts: Object.fromEntries(serviceLocationGroups.map(item => [item.status, item._count._all])),
      } : null,
      analytics: { periodDays, city: city || null, state: state || null, serviceType: serviceType || null, vendorsAdded, leadsInPeriod, topServices: topServices.map(item => ({ serviceType: item.shiftingType, count: item._count._all })) },
      generatedAt: new Date().toISOString(),
    } });
  } catch {
    return reply({ success: false, error: { code: "CRM_DASHBOARD_UNAVAILABLE", message: "CRM dashboard is temporarily unavailable." } }, 503);
  }
}
