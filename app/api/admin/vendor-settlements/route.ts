import { VendorSettlementStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { createVendorSettlement, listSettlementCandidates, listVendorSettlements, VendorSettlementError } from "@/lib/vendor-settlement-management";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.PAYMENT_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  const rawStatus = new URL(request.url).searchParams.get("status")?.toUpperCase();
  if (rawStatus && rawStatus !== "ALL" && !Object.values(VendorSettlementStatus).includes(rawStatus as VendorSettlementStatus))
    return reply({ success: false, error: { code: "INVALID_STATUS", message: "Settlement status is invalid." } }, 400);
  const [settlements, candidates] = await Promise.all([
    listVendorSettlements(rawStatus && rawStatus !== "ALL" ? rawStatus as VendorSettlementStatus : undefined),
    listSettlementCandidates(),
  ]);
  return reply({ success: true, data: { settlements, candidates, currentUserId: access.userId } });
}

export async function POST(request: Request) {
  try {
    const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.PAYMENT_MANAGE);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    const body = await request.json();
    const data = await createVendorSettlement({ vendorId: String(body.vendorId || ""), paymentId: String(body.paymentId || ""), amount: body.amount, expectedAt: body.expectedAt, remarks: body.remarks, actorUserId: access.userId });
    return reply({ success: true, data }, 201);
  } catch (error) {
    if (error instanceof VendorSettlementError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid JSON request body." } }, 400);
    const reference = crypto.randomUUID(); console.error(`[VENDOR_SETTLEMENT_CREATE_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_SETTLEMENT_CREATE_FAILED", message: `Unable to create settlement. Reference: ${reference}` } }, 503);
  }
}
