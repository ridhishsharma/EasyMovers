import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { canonicalState, citiesForState, indianStates, postalLocationCandidates } from "@/lib/india-location-catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.SERVICE_LOCATION_READ);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  const params = new URL(request.url).searchParams;
  const pin = params.get("pin")?.trim() ?? "";
  const state = params.get("state")?.trim() ?? "";
  if (pin && state) return reply({ success: false, error: { code: "INVALID_LOCATION_LOOKUP", message: "Search by either state or PIN code, not both." } }, 400);
  if (pin) {
    if (!/^[1-9][0-9]{5}$/.test(pin)) return reply({ success: false, error: { code: "INVALID_LOCATION_VERIFICATION_PIN", message: "Enter a valid six-digit Indian PIN code." } }, 400);
    try {
      return reply({ success: true, data: { candidates: await postalLocationCandidates(pin) } });
    } catch (error) {
      if (error instanceof Error && error.message === "POSTAL_CODE_NOT_FOUND") return reply({ success: false, error: { code: "POSTAL_CODE_NOT_FOUND", message: "No Indian postal location was found for this PIN code." } }, 404);
      return reply({ success: false, error: { code: "POSTAL_LOOKUP_UNAVAILABLE", message: "Postal lookup is temporarily unavailable. Try again shortly." } }, 503);
    }
  }
  if (state) {
    const canonical = canonicalState(state);
    if (!canonical) return reply({ success: false, error: { code: "INVALID_INDIAN_STATE", message: "Choose a valid Indian state or union territory." } }, 400);
    return reply({ success: true, data: { state: canonical, cities: citiesForState(canonical.name) } });
  }
  return reply({ success: true, data: { states: indianStates.map(([code, name]) => ({ code, name })) } });
}
