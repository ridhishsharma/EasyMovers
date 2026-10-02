import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { reviewVendorSettlement, VendorSettlementError } from "@/lib/vendor-settlement-management";

export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request, context: { params: Promise<{ settlementId: string }> }) {
  try {
    const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.SETTLEMENT_APPROVE);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    const body = await request.json();
    const decision = String(body.decision || "").toUpperCase();
    if (decision !== "APPROVED" && decision !== "REJECTED") return reply({ success: false, error: { code: "INVALID_DECISION", message: "Decision must be APPROVED or REJECTED." } }, 400);
    const { settlementId } = await context.params;
    const data = await reviewVendorSettlement({ settlementId, decision, reviewNote: body.reviewNote, actorUserId: access.userId });
    return reply({ success: true, data });
  } catch (error) {
    if (error instanceof VendorSettlementError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID(); console.error(`[VENDOR_SETTLEMENT_REVIEW_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_SETTLEMENT_REVIEW_FAILED", message: `Unable to review settlement. Reference: ${reference}` } }, 503);
  }
}
