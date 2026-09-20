import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  const administrator = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_APPLICATION_READ);

  if (!administrator.authorized) {
    return reply({
      success: false,
      error: {
        code: administrator.code,
        message: administrator.message,
      },
    }, administrator.status);
  }

  const { applicationId } = await context.params;
  const identifier = applicationId.trim();

  if (!identifier || identifier.length > 100) {
    return reply({
      success: false,
      error: {
        code: "INVALID_APPLICATION_IDENTIFIER",
        message: "A valid Vendor application identifier is required.",
      },
    }, 400);
  }

  try {
    const application = await prisma.vendorApplication.findFirst({
      where: {
        OR: [{ id: identifier }, { referenceId: identifier }],
      },
      select: {
        id: true,
        referenceId: true,
        companyName: true,
        businessType: true,
        operatingCategory: true,
        gstNumber: true,
        panNumber: true,
        contactName: true,
        mobile: true,
        email: true,
        addressLine1: true,
        city: true,
        state: true,
        postalCode: true,
        status: true,
        consentAt: true,
        reviewedAt: true,
        reviewNotes: true,
        createdAt: true,
        updatedAt: true,
        reviewedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        vendor: {
          select: {
            id: true,
            vendorCode: true,
            companyName: true,
            status: true,
            createdAt: true,
          },
        },
        callbackRequests: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            fullName: true,
            mobile: true,
            email: true,
            preferredTime: true,
            message: true,
            status: true,
            assignedTo: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!application) {
      return reply({
        success: false,
        error: {
          code: "VENDOR_APPLICATION_NOT_FOUND",
          message: "Vendor application was not found.",
        },
      }, 404);
    }

    return reply({ success: true, data: { application } });
  } catch {
    return reply({
      success: false,
      error: {
        code: "VENDOR_APPLICATION_DETAIL_UNAVAILABLE",
        message: "The Vendor application is temporarily unavailable.",
      },
    }, 503);
  }
}
