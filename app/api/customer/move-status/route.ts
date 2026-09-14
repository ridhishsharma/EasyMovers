import { NextResponse } from "next/server";
import { resolveApplicationAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const auth = await resolveApplicationAuthentication(request);
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!auth.authenticated || !auth.userId) return reply({ success: false, message: "Sign in with your linked EasyMovers account." }, 401);
  const bookingNumber = new URL(request.url).searchParams.get("bookingNumber")?.trim();
  if (!bookingNumber || bookingNumber.length > 100) return reply({ success: false, message: "Enter your booking number." }, 400);
  const admin = auth.roles?.some(role => role === "ADMIN" || role === "SUPER_ADMIN");
  try {
    // Filter ownership in the query, returning the same response for absent and inaccessible bookings.
    const booking = await prisma.booking.findFirst({
      where: { bookingNumber, ...(admin ? {} : auth.vendorId ? { vendorId: auth.vendorId } : { userId: auth.userId }) },
      select: { bookingNumber: true, bookingStatus: true, trackingStatus: true, updatedAt: true, pickupCity: true, dropCity: true },
    });
    if (!booking) return reply({ success: false, message: "No accessible booking found. Check the number and account linkage." }, 404);
    return reply({ success: true, booking, observedAt: new Date().toISOString(), locationTracking: false });
  } catch { return reply({ success: false, message: "Tracking is temporarily unavailable. Please retry." }, 503); }
}
