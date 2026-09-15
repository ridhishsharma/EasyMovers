import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkOrigin } from "@/lib/enquiry-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const value = (data: Record<string, unknown>, key: string, max: number) => {
  const result = data[key];
  if (typeof result !== "string" || !result.trim() || result.trim().length > max) throw Error("INVALID");
  return result.trim();
};

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id")?.trim() || crypto.randomUUID();
  let validated = false;
  try { checkOrigin(req); }
  catch { return reply({ success: false, error: { code: "INVALID_ORIGIN", message: "Invalid request origin." }, meta: { requestId, timestamp: new Date().toISOString() } }, 403); }
  try {
    if (!req.headers.get("content-type")?.startsWith("application/json") || Number(req.headers.get("content-length") || 0) > 4_000) throw Error("INVALID");
    const raw = await req.text();
    if (raw.length > 4_000) throw Error("INVALID");
    const data = JSON.parse(raw) as Record<string, unknown>;
    const fullName = value(data, "fullName", 100);
    const mobile = value(data, "mobile", 10);
    if (!/^[6-9][0-9]{9}$/.test(mobile) || data.consent !== true) throw Error("INVALID");
    const preferredTime = value(data, "preferredTime", 30);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\+05:30$/.test(preferredTime) || !Number.isFinite(Date.parse(preferredTime)) || Date.parse(preferredTime) <= Date.now() || Date.parse(preferredTime) > Date.now() + 30 * 86_400_000) throw Error("INVALID");
    validated = true;
    const applicationReference = typeof data.applicationReference === "string" ? data.applicationReference.trim() : "";
    const application = applicationReference ? await prisma.vendorApplication.findFirst({ where: { referenceId: applicationReference, mobile }, select: { id: true } }) : null;
    if (applicationReference && !application) return reply({ success: false, error: { code: "VENDOR_APPLICATION_NOT_FOUND", message: "Check the application reference and mobile number." }, meta: { requestId, timestamp: new Date().toISOString() } }, 404);
    const recent = await prisma.callbackRequest.count({ where: { mobile, serviceType: "VENDOR_ONBOARDING", createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
    if (recent >= 3) return reply({ success: false, error: { code: "CALLBACK_RATE_LIMITED", message: "A callback is already requested. You may also call +91 89595 91603." }, meta: { requestId, timestamp: new Date().toISOString() } }, 429);
    const callback = await prisma.callbackRequest.create({ data: { fullName, mobile, email: typeof data.email === "string" ? data.email.trim().toLowerCase().slice(0, 254) : null, city: typeof data.city === "string" ? data.city.trim().slice(0, 100) : null, serviceType: "VENDOR_ONBOARDING", preferredTime, message: applicationReference ? `Vendor application ${applicationReference}` : "New company partner callback", vendorApplicationId: application?.id }, select: { id: true, status: true } });
    return reply({ success: true, data: { callbackId: callback.id, status: callback.status }, meta: { requestId, timestamp: new Date().toISOString() } }, 201);
  } catch {
    return validated
      ? reply({ success: false, error: { code: "CALLBACK_REQUEST_FAILED", message: "Unable to save the callback request. Please retry or call +91 89595 91603." }, meta: { requestId, timestamp: new Date().toISOString() } }, 503)
      : reply({ success: false, error: { code: "CALLBACK_VALIDATION_FAILED", message: "Enter a valid name, mobile number and callback time within the next 30 days." }, meta: { requestId, timestamp: new Date().toISOString() } }, 400);
  }
}
