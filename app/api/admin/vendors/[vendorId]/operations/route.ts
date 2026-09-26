import { NextResponse } from "next/server";
import {
  authorizeCrmPermission,
  CRM_PERMISSIONS,
} from "@/lib/crm-authorization";
import {
  changeVendorOperationalStatus,
  performVendorOperationalAction,
  VendorOperationsError,
} from "@/lib/vendor-operational-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const MAKER_CHECKER_ACTIONS = new Set([
  "ADD_VEHICLE",
  "UPDATE_VEHICLE",
  "DEACTIVATE_VEHICLE",
  "ADD_DOCUMENT",
  "DEACTIVATE_DOCUMENT",
  "ADD_BANK_ACCOUNT",
  "DEACTIVATE_BANK_ACCOUNT",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ vendorId: string }> },
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "").toUpperCase();
    if (MAKER_CHECKER_ACTIONS.has(action))
      return reply(
        {
          success: false,
          error: {
            code: "MAKER_CHECKER_REQUIRED",
            message:
              "Submit this vendor change through Change approvals for independent verification.",
          },
        },
        409,
      );
    const permission =
      body.action === "SET_STATUS"
        ? CRM_PERMISSIONS.VENDOR_ACTIVATE
        : body.action === "REVIEW_DOCUMENT" ||
            body.action === "VERIFY_BANK_ACCOUNT"
          ? CRM_PERMISSIONS.VENDOR_VERIFY
          : CRM_PERMISSIONS.VENDOR_MANAGE;
    const access = await authorizeCrmPermission(request, permission);
    if (!access.authorized)
      return reply(
        {
          success: false,
          error: { code: access.code, message: access.message },
        },
        access.status,
      );
    const { vendorId } = await context.params;
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const data =
      body.action === "SET_STATUS"
        ? await changeVendorOperationalStatus(
            vendorId,
            body.activate === true,
            access.userId,
            ipAddress,
          )
        : await performVendorOperationalAction(
            vendorId,
            body,
            access.userId,
            ipAddress,
          );
    return reply({ success: true, data });
  } catch (error) {
    if (error instanceof SyntaxError)
      return reply(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "Provide a valid JSON request body.",
          },
        },
        400,
      );
    if (error instanceof VendorOperationsError)
      return reply(
        { success: false, error: { code: error.code, message: error.message } },
        error.status,
      );
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_OPERATION_FAILED:${reference}]`, error);
    return reply(
      {
        success: false,
        error: {
          code: "VENDOR_OPERATION_FAILED",
          message: `Unable to update vendor operations. Reference: ${reference}`,
        },
      },
      503,
    );
  }
}
