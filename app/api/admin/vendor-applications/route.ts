import { VendorApplicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeAdministrator } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function positiveInteger(
  value: string | null,
  fallback: number,
  maximum: number
) {
  if (value === null) return fallback;

  if (!/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : null;
}

function applicationStatus(value: string | null) {
  if (!value) return undefined;

  const normalized = value.trim().toUpperCase();
  return Object.values(VendorApplicationStatus).includes(
    normalized as VendorApplicationStatus
  )
    ? (normalized as VendorApplicationStatus)
    : null;
}

export async function GET(request: Request) {
  const administrator = await authorizeAdministrator(request);

  if (!administrator.authorized) {
    return reply({
      success: false,
      error: {
        code: administrator.code,
        message: administrator.message,
      },
    }, administrator.status);
  }

  const url = new URL(request.url);
  const page = positiveInteger(url.searchParams.get("page"), 1, 100_000);
  const pageSize = positiveInteger(url.searchParams.get("pageSize"), 20, 100);
  const status = applicationStatus(url.searchParams.get("status"));
  const search = url.searchParams.get("search")?.trim() ?? "";

  if (page === null || pageSize === null) {
    return reply({
      success: false,
      error: {
        code: "INVALID_PAGINATION",
        message: "page and pageSize must be positive integers; pageSize cannot exceed 100.",
      },
    }, 400);
  }

  if (status === null) {
    return reply({
      success: false,
      error: {
        code: "INVALID_VENDOR_APPLICATION_STATUS",
        message: "The Vendor application status filter is invalid.",
      },
    }, 400);
  }

  if (search.length > 100) {
    return reply({
      success: false,
      error: {
        code: "INVALID_SEARCH",
        message: "The search value cannot exceed 100 characters.",
      },
    }, 400);
  }

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { referenceId: { contains: search, mode: "insensitive" as const } },
            { companyName: { contains: search, mode: "insensitive" as const } },
            { contactName: { contains: search, mode: "insensitive" as const } },
            { mobile: { contains: search } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [total, applications] = await prisma.$transaction([
      prisma.vendorApplication.count({ where }),
      prisma.vendorApplication.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          referenceId: true,
          companyName: true,
          businessType: true,
          operatingCategory: true,
          contactName: true,
          mobile: true,
          email: true,
          city: true,
          state: true,
          postalCode: true,
          status: true,
          reviewedAt: true,
          reviewNotes: true,
          createdAt: true,
          updatedAt: true,
          vendor: {
            select: {
              id: true,
              vendorCode: true,
              status: true,
            },
          },
          _count: {
            select: { callbackRequests: true },
          },
        },
      }),
    ]);

    return reply({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch {
    return reply({
      success: false,
      error: {
        code: "VENDOR_APPLICATION_LIST_UNAVAILABLE",
        message: "Vendor applications are temporarily unavailable.",
      },
    }, 503);
  }
}
