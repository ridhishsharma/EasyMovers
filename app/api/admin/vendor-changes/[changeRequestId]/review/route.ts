import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { reviewVendorChange, VendorChangeError } from "@/lib/vendor-change-control";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, context: { params: Promise<{ changeRequestId: string }> }) {
  try {
    const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_VERIFY);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    const body = await request.json();
    const decision = String(body.decision || "").toUpperCase();
    if (decision !== "APPROVED" && decision !== "REJECTED")
      return reply({ success: false, error: { code: "INVALID_DECISION", message: "Decision must be APPROVED or REJECTED." } }, 400);
    const { changeRequestId } = await context.params;
    const data = await reviewVendorChange({
      changeRequestId,
      reviewerUserId: access.userId,
      decision,
      reviewNote: typeof body.reviewNote === "string" ? body.reviewNote : null,
    });
    return reply({ success: true, data });
  } catch (error) {
    if (error instanceof VendorChangeError)
      return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof SyntaxError)
      return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid JSON request body." } }, 400);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_CHANGE_REVIEW_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_CHANGE_REVIEW_FAILED", message: `Unable to review vendor change. Reference: ${reference}` } }, 503);
  }
}
