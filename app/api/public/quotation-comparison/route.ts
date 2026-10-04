import { NextResponse } from "next/server";
import { readDraftSession } from "@/lib/enquiry-session";
import { customerQuotationComparison } from "@/lib/customer-quotation-comparison";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference")?.trim() || "";
  if (!/^EM-[A-Z0-9-]{6,80}$/i.test(reference)) return reply({ success: false, message: "Enter a valid customer reference." }, 400);
  const session = readDraftSession(request, reference);
  if (!session) return reply({ success: false, verificationRequired: true, message: "Verify the registered mobile number to compare quotations." }, 401);
  try {
    const data = await customerQuotationComparison(session.id);
    if (!data || data.reference !== reference) return reply({ success: false, message: "Quotation request not found." }, 404);
    return reply({ success: true, data });
  } catch (error) {
    const referenceId = crypto.randomUUID();
    console.error(`[CUSTOMER_QUOTATION_COMPARISON_FAILED:${referenceId}]`, error);
    return reply({ success: false, message: `Quotations are temporarily unavailable. Reference: ${referenceId}` }, 503);
  }
}
