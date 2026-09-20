import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import {
  reviewVendorApplication,
  VendorApplicationReviewError,
  type VendorApplicationReviewAction,
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
  const administrator = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_APPLICATION_REVIEW);

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
    const body = await request.json();
    const action = body?.action as VendorApplicationReviewAction;
    const application = await reviewVendorApplication({
      applicationId,
      action,
      administratorUserId: administrator.userId,
      reason: body?.reason,
    });

    return reply({ success: true, data: { application } });
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
        code: "VENDOR_APPLICATION_REVIEW_FAILED",
        message: "Unable to update the Vendor application review.",
      },
    }, 503);
  }
}
