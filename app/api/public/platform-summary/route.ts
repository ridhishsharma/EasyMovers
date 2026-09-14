import { NextResponse } from "next/server";

/** Publish only figures approved for public display; never expose staging records. */
export async function GET() {
  const read = (name: string, max = Number.MAX_SAFE_INTEGER) => {
    const raw = process.env[name];
    if (!raw?.trim()) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 && value <= max ? value : null;
  };
  const integer = (name: string) => { const value = read(name); return value !== null && Number.isInteger(value) ? value : null; };
  const updatedAt = process.env.PUBLIC_METRICS_UPDATED_AT;
  return NextResponse.json({
    successfulMoves: integer("PUBLIC_SUCCESSFUL_MOVES"),
    citiesCovered: integer("PUBLIC_CITIES_COVERED"),
    verifiedVendors: integer("PUBLIC_VERIFIED_VENDORS"),
    rating: read("PUBLIC_CUSTOMER_RATING", 5),
    updatedAt: updatedAt && !Number.isNaN(Date.parse(updatedAt)) ? new Date(updatedAt).toISOString() : null,
    source: "Approved platform figures",
  }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
