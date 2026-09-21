import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedStatuses = new Set(["ACTIVE", "INACTIVE", "PENDING"]);
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim() ?? "";
  const status = params.get("status")?.trim().toUpperCase() ?? "";
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "25");
  if (search.length > 100 || !Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 || (status && !allowedStatuses.has(status))) {
    return reply({ success: false, error: { code: "INVALID_VENDOR_FILTER", message: "Use a valid vendor status, search and pagination." } }, 400);
  }
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(search ? { OR: [
      { companyName: { contains: search, mode: "insensitive" as const } },
      { vendorCode: { contains: search, mode: "insensitive" as const } },
      { ownerName: { contains: search, mode: "insensitive" as const } },
      { ownerMobile: { contains: search } },
      { city: { contains: search, mode: "insensitive" as const } },
    ] } : {}),
  };
  try {
    const [vendors, total] = await prisma.$transaction([
      prisma.vendor.findMany({
        where, orderBy: [{ createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize,
        select: {
          id: true, vendorCode: true, companyName: true, ownerName: true, ownerMobile: true,
          ownerEmail: true, city: true, state: true, status: true, rating: true,
          completedMoves: true, createdAt: true,
          _count: { select: { serviceAreas: true, vehicles: true, documents: true, assignedBookings: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ]);
    return reply({ success: true, data: { vendors, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } });
  } catch {
    return reply({ success: false, error: { code: "CRM_VENDORS_UNAVAILABLE", message: "Vendor directory is temporarily unavailable." } }, 503);
  }
}
