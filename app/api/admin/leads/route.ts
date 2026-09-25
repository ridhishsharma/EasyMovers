import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const statuses = ["NEW", "CONTACTED", "QUALIFIED", "INVENTORY_PENDING", "QUOTATION_REQUESTED", "QUOTATION_RECEIVED", "BOOKING_CREATED", "CONVERTED", "LOST", "CLOSED"] as const;
const openStatuses = ["NEW", "CONTACTED", "QUALIFIED"] as const;
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.LEAD_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim() ?? "";
  const requestedStatus = params.get("status")?.trim().toUpperCase() ?? "";
  const period = params.get("period")?.trim().toLowerCase() ?? "";
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "25");
  const validStatus = !requestedStatus || requestedStatus === "OPEN" || statuses.includes(requestedStatus as typeof statuses[number]);
  const validPeriod = !period || period === "today" || ["7", "30", "90"].includes(period);
  if (search.length > 100 || !validStatus || !validPeriod || !Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return reply({ success: false, error: { code: "INVALID_LEAD_FILTER", message: "Use a valid lead status, period, search and pagination." } }, 400);
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const periodStart = period && period !== "today" ? new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000) : null;
  const where = {
    ...(requestedStatus === "OPEN" ? { status: { in: [...openStatuses] } } : requestedStatus ? { status: requestedStatus as typeof statuses[number] } : {}),
    ...(period === "today" ? { createdAt: { gte: today } } : periodStart ? { createdAt: { gte: periodStart } } : {}),
    ...(search ? { OR: [
      { referenceId: { contains: search, mode: "insensitive" as const } },
      { name: { contains: search, mode: "insensitive" as const } },
      { mobile: { contains: search } },
      { email: { contains: search, mode: "insensitive" as const } },
      { pickupCity: { contains: search, mode: "insensitive" as const } },
      { destinationCity: { contains: search, mode: "insensitive" as const } },
    ] } : {}),
  };
  try {
    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where, orderBy: [{ createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize,
        select: {
          id: true, referenceId: true, name: true, mobile: true, email: true,
          pickupCity: true, destinationCity: true, shiftingType: true, shiftingDate: true,
          source: true, status: true, createdAt: true, lastUpdatedAt: true,
          _count: { select: { bookings: true, quotations: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);
    return reply({ success: true, data: { leads, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } });
  } catch {
    return reply({ success: false, error: { code: "CRM_LEADS_UNAVAILABLE", message: "Lead pipeline is temporarily unavailable." } }, 503);
  }
}
