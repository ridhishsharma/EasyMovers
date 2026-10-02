import { NextResponse } from "next/server";
import { authorizeVendorPortal } from "@/lib/vendor-portal-auth";
import { getVendorPortalOverview, VendorPortalError } from "@/lib/vendor-portal";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  try {
    const access = await authorizeVendorPortal(request);
    if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
    await prisma.user.updateMany({
      where: { id: access.userId, vendorId: access.vendorId, role: "VENDOR", isActive: true },
      data: { emailVerified: true, lastLogin: new Date() },
    });
    return reply({ success: true, data: await getVendorPortalOverview(access.userId, access.vendorId) });
  } catch (error) {
    if (error instanceof VendorPortalError) return reply({ success: false, error: { code: error.code, message: error.message } }, error.status);
    const reference = crypto.randomUUID();
    console.error(`[VENDOR_PORTAL_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "VENDOR_PORTAL_FAILED", message: `Unable to load the vendor portal. Reference: ${reference}` } }, 503);
  }
}
