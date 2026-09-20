import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import {
  approveVendorApplication,
  VendorApplicationReviewError,
} from "@/lib/vendor-application-review";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  const administrator = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_APPLICATION_APPROVE);

  if (!administrator.authorized) {
    return reply({
      success: false,
      error: {
        code: administrator.code,
        message: administrator.message,
      },
    }, administrator.status);
  }

  try {
    const { applicationId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await approveVendorApplication({
      applicationId,
      administratorUserId: administrator.userId,
      notes: body?.notes,
    });

    return reply({ success: true, data: result });
  } catch (error) {
    if (error instanceof VendorApplicationReviewError) {
      return reply({
        success: false,
        error: { code: error.code, message: error.message },
      }, error.status);
    }

    return reply({
      success: false,
      error: {
        code: "VENDOR_APPLICATION_APPROVAL_FAILED",
        message: "Unable to approve the Vendor application.",
      },
    }, 503);
  }
}
