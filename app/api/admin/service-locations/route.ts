import { ServiceLocationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { createServiceLocation, ServiceLocationError } from "@/lib/service-location-management";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error: unknown) => error instanceof ServiceLocationError
  ? reply({ success: false, error: { code: error.code, message: error.message } }, error.status)
  : reply({ success: false, error: { code: "SERVICE_LOCATION_OPERATION_FAILED", message: "The service location operation could not be completed." } }, 503);

export async function GET(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim() ?? "";
  const statusValue = params.get("status")?.trim().toUpperCase() ?? "";
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "25");
  const status = statusValue && Object.values(ServiceLocationStatus).includes(statusValue as ServiceLocationStatus)
    ? statusValue as ServiceLocationStatus : undefined;
  if (search.length > 100 || !Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 || (statusValue && !status)) {
    return reply({ success: false, error: { code: "INVALID_SERVICE_LOCATION_FILTER", message: "Use a valid search, status and pagination." } }, 400);
  }
  const where = {
    ...(status ? { status } : {}),
    ...(search ? { OR: [
      { code: { contains: search, mode: "insensitive" as const } },
      { city: { contains: search, mode: "insensitive" as const } },
      { state: { contains: search, mode: "insensitive" as const } },
    ] } : {}),
  };
  try {
    const [locations, total] = await prisma.$transaction([
      prisma.serviceLocation.findMany({
        where, orderBy: [{ status: "asc" }, { state: "asc" }, { city: "asc" }],
        skip: (page - 1) * pageSize, take: pageSize,
        select: {
          id: true, code: true, city: true, state: true, countryCode: true, status: true,
          plannedLaunchAt: true, activatedAt: true, suspendedAt: true, updatedAt: true,
          _count: { select: { services: true } },
        },
      }),
      prisma.serviceLocation.count({ where }),
    ]);
    return reply({ success: true, data: { locations, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_MANAGE);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const location = await createServiceLocation(await request.json(), access.userId, request.headers.get("x-forwarded-for")?.split(",")[0]?.trim());
    return reply({ success: true, data: { location } }, 201);
  } catch (error) { return failure(error); }
}
