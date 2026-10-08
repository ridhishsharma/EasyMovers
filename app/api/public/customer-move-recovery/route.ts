import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkOrigin, customerAccessCookie, customerRecoveryToken, readCustomerRecoveryToken } from "@/lib/enquiry-session";
import { customerTestOtpConfig, isAllowedCustomerTestPhone, matchesCustomerTestOtp } from "@/lib/customer-test-otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; resetAt: number }>();
const reply = (body: object, status = 200, cookie?: string) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...(cookie ? { "Set-Cookie": cookie } : {}) } });

function limited(key: string) {
  const now = Date.now(), current = attempts.get(key);
  if (!current || current.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 }); return false; }
  current.count += 1;
  return current.count > 5;
}

async function verifiedMobile(request: Request, body: Record<string, unknown>) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (token) {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const { data, error } = await createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).auth.getUser(token);
    const phone = data.user?.phone;
    return !error && data.user?.phone_confirmed_at && phone && /^\+?91[6-9]\d{9}$/.test(phone) ? phone.replace(/^\+?91/, "") : null;
  }
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const config = customerTestOtpConfig(request);
  return config && isAllowedCustomerTestPhone(config, mobile) && matchesCustomerTestOtp(config, code) ? mobile : null;
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (raw.length > 2500) return reply({ success: false, message: "Invalid recovery request." }, 400);
    const body = JSON.parse(raw) as Record<string, unknown>, action = body.action;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (limited(`${action}:${ip}`)) return reply({ success: false, message: "Too many recovery attempts. Try again later." }, 429);
    if (action === "REQUEST") return reply({ success: true, message: "If this mobile is registered, a verification code can be entered." });
    if (action === "VERIFY") {
      const mobile = await verifiedMobile(request, body);
      if (!mobile) return reply({ success: false, message: "Mobile verification failed." }, 401);
      const leads = await prisma.lead.findMany({
        where: { mobile }, orderBy: { createdAt: "desc" }, take: 20,
        select: { id: true, referenceId: true, pickupCity: true, destinationCity: true, status: true, createdAt: true, bookings: { orderBy: { createdAt: "desc" }, take: 1, select: { bookingNumber: true } } },
      });
      return reply({ success: true, data: leads.map(lead => ({
        reference: lead.referenceId,
        route: `${lead.pickupCity || "Pickup"} → ${lead.destinationCity || "Destination"}`,
        status: lead.status,
        createdAt: lead.createdAt,
        bookingNumber: lead.bookings[0]?.bookingNumber || null,
        token: customerRecoveryToken(lead.id, lead.referenceId, mobile),
      })) });
    }
    if (action === "OPEN") {
      const token = typeof body.token === "string" ? body.token : "";
      const reference = typeof body.reference === "string" ? body.reference.trim() : "";
      const recovery = readCustomerRecoveryToken(token);
      if (!recovery || recovery.reference !== reference) return reply({ success: false, message: "Recovery verification has expired. Verify your mobile again." }, 401);
      const lead = await prisma.lead.findFirst({
        where: { id: recovery.id, referenceId: reference, mobile: recovery.mobile },
        select: { id: true, referenceId: true, inventory: { select: { status: true } }, quotations: { where: { status: { in: ["SUBMITTED", "REVISED", "SHORTLISTED"] } }, take: 1, select: { id: true } }, bookings: { orderBy: { createdAt: "desc" }, take: 1, select: { selectedQuotationId: true } } },
      });
      if (!lead) return reply({ success: false, message: "Move not found." }, 404);
      const destination = lead.bookings[0]?.selectedQuotationId || (lead.inventory?.status === "SUBMITTED" && lead.quotations.length) ? `/quotes/${encodeURIComponent(reference)}` : `/draft/${encodeURIComponent(reference)}`;
      return reply({ success: true, destination }, 200, customerAccessCookie(lead.id, lead.referenceId, new URL(request.url).protocol === "https:"));
    }
    return reply({ success: false, message: "Choose a valid recovery action." }, 400);
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, message: "Provide a valid recovery request." }, 400);
    if (error instanceof Error && error.message === "Invalid origin") return reply({ success: false, message: "Recovery request blocked for security." }, 403);
    console.error("[CUSTOMER_MOVE_RECOVERY_FAILED]", error);
    return reply({ success: false, message: "Move recovery is temporarily unavailable." }, 503);
  }
}
