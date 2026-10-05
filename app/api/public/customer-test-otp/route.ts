import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  customerTestOtpConfig,
  isAllowedCustomerTestPhone,
  matchesCustomerTestOtp,
} from "@/lib/customer-test-otp";
import { checkOrigin, customerAccessCookie } from "@/lib/enquiry-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function reply(body: object, status = 200, cookie?: string) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
}

function limited(key: string, maximum: number) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > maximum;
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const config = customerTestOtpConfig(request);
    if (!config)
      return reply(
        { success: false, message: "Staging mobile verification is unavailable." },
        503,
      );

    const raw = await request.text();
    if (raw.length > 500)
      return reply({ success: false, message: "Invalid request." }, 400);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const action = body.action;
    const reference =
      typeof body.reference === "string" ? body.reference.trim() : "";
    const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
    if (
      !["REQUEST", "VERIFY"].includes(String(action)) ||
      !/^EM-[A-Z0-9-]{6,80}$/i.test(reference) ||
      !/^[6-9]\d{9}$/.test(mobile)
    )
      return reply({ success: false, message: "Check the reference and mobile number." }, 400);

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = `${ip}:${reference}`;
    if (limited(`${action}:${key}`, action === "VERIFY" ? 5 : 10))
      return reply(
        { success: false, message: "Too many verification attempts. Try again later." },
        429,
      );

    if (action === "REQUEST") {
      // Always return the same response so this staging endpoint cannot be used
      // to discover which reference/mobile combinations exist.
      return reply({
        success: true,
        message: "Enter the configured staging verification code.",
      });
    }

    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (
      !isAllowedCustomerTestPhone(config, mobile) ||
      !matchesCustomerTestOtp(config, code)
    )
      return reply(
        { success: false, message: "The verification code is incorrect." },
        401,
      );

    const lead = await prisma.lead.findFirst({
      where: { referenceId: reference, mobile },
      select: { id: true, referenceId: true },
    });
    if (!lead)
      return reply(
        { success: false, message: "No matching move was found for this mobile." },
        404,
      );

    attempts.delete(`VERIFY:${key}`);
    return reply(
      { success: true, reference: lead.referenceId },
      200,
      customerAccessCookie(
        lead.id,
        lead.referenceId,
        new URL(request.url).protocol === "https:",
      ),
    );
  } catch {
    return reply(
      { success: false, message: "Unable to verify the mobile. Please retry." },
      503,
    );
  }
}
