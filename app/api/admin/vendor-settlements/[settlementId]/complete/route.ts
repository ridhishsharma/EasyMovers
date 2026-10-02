import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { completeVendorSettlement, VendorSettlementError } from "@/lib/vendor-settlement-management";

export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request, context: { params: Promise<{ settlementId: string }> }) {
  try {
    const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.PAYMENT_MANAGE);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    const body = await request.json();
    const outcome = String(body.outcome || "").toUpperCase();
    if (outcome !== "SETTLED" && outcome !== "FAILED") return reply({ success: false, error: { code: "INVALID_OUTCOME", message: "Outcome must be SETTLED or FAILED." } }, 400);
    const { settlementId } = await context.params;
    const data = await completeVendorSettlement({ settlementId, outcome, settlementReference: body.settlementReference, failureReason: body.failureReason, remarks: body.remarks, actorUserId: access.userId });
    return reply({ success: true, data });
  } catch (error) {
    if (error instanceof VendorSettlementError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID(); console.error(`[VENDOR_SETTLEMENT_COMPLETE_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_SETTLEMENT_COMPLETE_FAILED", message: `Unable to complete settlement. Reference: ${reference}` } }, 503);
  }
}
