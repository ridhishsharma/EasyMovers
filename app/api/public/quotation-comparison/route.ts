import { NextResponse } from "next/server";
import { QuotationStatus } from "@prisma/client";
import { readDraftSession, checkOrigin } from "@/lib/enquiry-session";
import { customerQuotationComparison } from "@/lib/customer-quotation-comparison";
import { getOrCreateQuotationModule } from "@/domains/quotation/quotation.module";
import { prisma } from "@/lib/prisma";

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

const selectableStatuses = new Set<QuotationStatus>([
  QuotationStatus.SUBMITTED,
  QuotationStatus.REVISED,
  QuotationStatus.SHORTLISTED,
]);

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    checkOrigin(request);
    const body = await request.json() as Record<string, unknown>;
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    const quotationId = typeof body.quotationId === "string" ? body.quotationId.trim() : "";
    if (!/^EM-[A-Z0-9-]{6,80}$/i.test(reference) || !quotationId || quotationId.length > 100)
      return reply({ success: false, message: "Choose a valid quotation request." }, 400);

    const session = readDraftSession(request, reference);
    if (!session)
      return reply({ success: false, verificationRequired: true, message: "Verify the registered mobile number before choosing a quotation." }, 401);

    const lead = await prisma.lead.findUnique({
      where: { id: session.id },
      select: {
        referenceId: true,
        bookings: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, bookingNumber: true, selectedQuotationId: true } },
        quotations: {
          where: { id: quotationId },
          take: 1,
          select: {
            id: true, bookingId: true, status: true, validUntil: true,
            pickupDate: true, deliveryDate: true, totalAmount: true,
            vendor: { select: { status: true } },
          },
        },
      },
    });
    if (!lead || lead.referenceId !== reference)
      return reply({ success: false, message: "Quotation request not found." }, 404);
    const booking = lead.bookings[0];
    const quotation = lead.quotations[0];
    if (!booking || !quotation || quotation.bookingId !== booking.id)
      return reply({ success: false, message: "This quotation does not belong to the current booking." }, 404);
    if (booking.selectedQuotationId && booking.selectedQuotationId !== quotation.id)
      return reply({ success: false, message: "Another quotation has already been selected. Contact EasyMovers before changing it." }, 409);
    if (!selectableStatuses.has(quotation.status))
      return reply({ success: false, message: "This quotation is no longer available for selection." }, 409);
    if (quotation.validUntil && quotation.validUntil.getTime() < Date.now())
      return reply({ success: false, message: "This quotation has expired. Ask EasyMovers for a refreshed offer." }, 409);
    if (!quotation.pickupDate || !quotation.deliveryDate || Number(quotation.totalAmount) <= 0)
      return reply({ success: false, message: "This quotation is incomplete and cannot be selected." }, 409);
    if (quotation.vendor.status !== "ACTIVE")
      return reply({ success: false, message: "This partner is not currently available for booking." }, 409);

    const module = getOrCreateQuotationModule({ prisma });
    const result = await module.service.selectCustomerSafe({
      bookingId: booking.id,
      quotationId: quotation.id,
      selectedBy: `customer:${session.id}`,
      remarks: "Selected through verified customer quotation comparison.",
    });
    if (!result.success)
      return reply({ success: false, message: result.error.message, code: result.error.code }, result.error.code === "SELECTED_QUOTATION_MUTATION_BLOCKED" ? 409 : 400);

    if (result.data.changed) {
      await prisma.crmAuditLog.create({
        data: {
          action: "CUSTOMER_QUOTATION_SELECTED",
          entityType: "Booking",
          entityId: booking.id,
          metadata: { leadId: session.id, reference, bookingNumber: booking.bookingNumber, quotationId: quotation.id, requestId },
        },
      }).catch(error => console.error(`[CUSTOMER_QUOTATION_SELECTION_AUDIT_FAILED:${requestId}]`, error));
    }
    return reply({
      success: true,
      data: { bookingNumber: booking.bookingNumber, selectedQuotationId: quotation.id, changed: result.data.changed },
      message: result.data.changed ? "Quotation selected. Continue to booking confirmation." : "This quotation is already selected.",
    });
  } catch (error) {
    if (error instanceof SyntaxError)
      return reply({ success: false, message: "Provide a valid quotation selection." }, 400);
    if (error instanceof Error && error.message === "Invalid origin")
      return reply({ success: false, message: "Quotation selection was blocked for security." }, 403);
    console.error(`[CUSTOMER_QUOTATION_SELECTION_FAILED:${requestId}]`, error);
    return reply({ success: false, message: `Unable to select the quotation. Reference: ${requestId}` }, 503);
  }
}
