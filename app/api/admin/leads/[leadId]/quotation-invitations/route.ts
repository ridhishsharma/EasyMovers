import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { getLeadQuotationInvitationWorkspace, inviteVendorsToLead, LeadInvitationError } from "@/lib/lead-quotation-invitations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, context: { params: Promise<{ leadId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.LEAD_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { leadId } = await context.params;
    return reply({ success: true, data: await getLeadQuotationInvitationWorkspace(leadId) });
  } catch (error) {
    if (error instanceof LeadInvitationError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[LEAD_RFQ_WORKSPACE_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "LEAD_RFQ_WORKSPACE_FAILED", message: `Unable to load eligible vendors. Reference: ${reference}` } }, 503);
  }
}

export async function POST(request: Request, context: { params: Promise<{ leadId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.LEAD_ASSIGN);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const body = await request.json() as Record<string, unknown>;
    const { leadId } = await context.params;
    if (!Array.isArray(body.vendorIds) || body.vendorIds.some(id => typeof id !== "string" || !id || id.length > 100))
      return reply({ success: false, error: { code: "INVALID_VENDOR_SELECTION", message: "Select valid eligible vendors." } }, 400);
    const data = await inviteVendorsToLead({ leadId, vendorIds: body.vendorIds as string[], expiresAt: new Date(String(body.expiresAt || "")), invitedByUserId: access.userId });
    return reply({ success: true, data, message: `${data.invited.length} quotation request(s) sent and recorded.` }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide a valid invitation request." } }, 400);
    if (error instanceof LeadInvitationError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[LEAD_RFQ_SEND_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "LEAD_RFQ_SEND_FAILED", message: `Unable to send quotation requests. Reference: ${reference}` } }, 503);
  }
}
