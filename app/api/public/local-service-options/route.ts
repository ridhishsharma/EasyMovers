import { NextResponse } from "next/server";
import { localServiceCities, localVehicles } from "@/lib/local-services";

export async function GET() {
  return NextResponse.json({ status: "available", cities: localServiceCities,
    vehicles: localVehicles, availability: "Subject to confirmation",
  }, { headers: { "Cache-Control": "no-store" } });
}
