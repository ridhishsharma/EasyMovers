import {
  VendorChangeAction,
  VendorChangeEntityType,
  VendorChangeSource,
  VendorChangeStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import {
  listVendorChanges,
  submitVendorChange,
  VendorChangeError,
} from "@/lib/vendor-change-control";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_VERIFY);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  const value = new URL(request.url).searchParams.get("status")?.toUpperCase() || "PENDING";
  if (!Object.values(VendorChangeStatus).includes(value as VendorChangeStatus))
    return reply({ success: false, error: { code: "INVALID_STATUS", message: "Vendor change status is invalid." } }, 400);
  const changes = await listVendorChanges(value as VendorChangeStatus);
  return reply({ success: true, data: { changes } });
}

export async function POST(request: Request) {
  try {
    const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.VENDOR_MANAGE);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    const body = await request.json();
    const entityType = String(body.entityType || "").toUpperCase() as VendorChangeEntityType;
    const action = String(body.action || "").toUpperCase() as VendorChangeAction;
    if (!Object.values(VendorChangeEntityType).includes(entityType) || !Object.values(VendorChangeAction).includes(action))
      return reply({ success: false, error: { code: "INVALID_CHANGE", message: "Entity type or action is invalid." } }, 400);
    const data = await submitVendorChange({
      vendorId: String(body.vendorId || ""),
      entityType,
      action,
      entityId: typeof body.entityId === "string" ? body.entityId : null,
      source: VendorChangeSource.EM_STAFF,
      proposedData: body.proposedData,
      previousData: body.previousData,
      submissionNote: typeof body.submissionNote === "string" ? body.submissionNote : null,
      submittedByUserId: access.userId,
    });
    return reply({ success: true, data }, 201);
  } catch (error) {
    if (error instanceof VendorChangeError)
      return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof SyntaxError)
      return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid JSON request body." } }, 400);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_CHANGE_SUBMISSION_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_CHANGE_SUBMISSION_FAILED", message: `Unable to submit vendor change. Reference: ${reference}` } }, 503);
  }
}
