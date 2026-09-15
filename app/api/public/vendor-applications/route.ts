import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkOrigin } from "@/lib/enquiry-session";
import { parseVendorApplication, vendorApplicationError, vendorApplicationReference, verifyVendorPostalLocation } from "@/lib/vendor-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function json(req: Request) {
  if (!req.headers.get("content-type")?.startsWith("application/json")) throw Error("INVALID_REQUEST");
  if (Number(req.headers.get("content-length") || 0) > 20_000) throw Error("INVALID_REQUEST");
  const raw = await req.text();
  if (raw.length > 20_000) throw Error("INVALID_REQUEST");
  return JSON.parse(raw);
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id")?.trim() || crypto.randomUUID();
  try { checkOrigin(req); }
  catch { return reply({ success: false, error: { code: "INVALID_ORIGIN", message: "Invalid request origin." }, meta: { requestId, timestamp: new Date().toISOString() } }, 403); }
  try {
    let input;
    try { input = parseVendorApplication(await json(req)); }
    catch (error) { return reply({ success: false, error: { code: "VENDOR_APPLICATION_VALIDATION_FAILED", message: vendorApplicationError(error) }, meta: { requestId, timestamp: new Date().toISOString() } }, 400); }

    const existing = await prisma.vendorApplication.findUnique({ where: { requestId: input.requestId }, select: { referenceId: true, status: true } });
    if (existing) return reply({ success: true, data: { reference: existing.referenceId, status: existing.status, duplicate: true }, meta: { requestId, timestamp: new Date().toISOString() } });

    try { await verifyVendorPostalLocation(input); }
    catch (error) {
      const unavailable = error instanceof Error && error.message === "POSTAL_LOOKUP_UNAVAILABLE";
      return reply({ success: false, error: { code: unavailable ? "POSTAL_LOOKUP_UNAVAILABLE" : "VENDOR_APPLICATION_LOCATION_INVALID", message: vendorApplicationError(error) }, meta: { requestId, timestamp: new Date().toISOString() } }, unavailable ? 503 : 400);
    }

    const recent = await prisma.vendorApplication.count({ where: { mobile: input.mobile, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
    if (recent >= 3) return reply({ success: false, error: { code: "VENDOR_APPLICATION_RATE_LIMITED", message: "Please wait before submitting another application or call EasyMovers support." }, meta: { requestId, timestamp: new Date().toISOString() } }, 429);

    const created = await prisma.vendorApplication.create({ data: {
      referenceId: vendorApplicationReference(), requestId: input.requestId,
      companyName: input.companyName, businessType: input.businessType,
      operatingCategory: input.operatingCategory, gstNumber: input.gstNumber,
      panNumber: input.panNumber, contactName: input.contactName, mobile: input.mobile,
      email: input.email, addressLine1: input.addressLine1, city: input.city,
      state: input.state, postalCode: input.postalCode, consentAt: new Date(),
    }, select: { referenceId: true, status: true } });
    return reply({ success: true, data: { reference: created.referenceId, status: created.status }, meta: { requestId, timestamp: new Date().toISOString() } }, 201);
  } catch {
    return reply({ success: false, error: { code: "VENDOR_APPLICATION_FAILED", message: "Unable to save the application. Please retry or call EasyMovers support." }, meta: { requestId, timestamp: new Date().toISOString() } }, 503);
  }
}
