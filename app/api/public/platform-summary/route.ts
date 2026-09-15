import { NextResponse } from "next/server";

/** Publish only figures approved for public display; never expose staging records. */
export async function GET() {
  let missing = 0;
  let invalid = false;
  const read = (name: string, max = Number.MAX_SAFE_INTEGER) => {
    const raw = process.env[name];
    if (!raw?.trim()) { missing++; return null; }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > max) { invalid = true; return null; }
    return value;
  };
  const integer = (name: string) => { const value = read(name); if (value !== null && !Number.isSafeInteger(value)) { invalid = true; return null; } return value; };
  const updatedAt = process.env.PUBLIC_METRICS_UPDATED_AT;
  const metrics = {
    successfulMoves: integer("PUBLIC_SUCCESSFUL_MOVES"),
    citiesCovered: integer("PUBLIC_CITIES_COVERED"),
    verifiedVendors: integer("PUBLIC_VERIFIED_VENDORS"),
    rating: read("PUBLIC_CUSTOMER_RATING", 5),
    updatedAt: updatedAt && !Number.isNaN(Date.parse(updatedAt)) ? new Date(updatedAt).toISOString() : null,
    source: "Approved platform figures",
  };
  if (updatedAt && Number.isNaN(Date.parse(updatedAt))) invalid = true;
  return NextResponse.json({ ...metrics, configuration: invalid ? "invalid" : missing === 4 ? "missing" : missing ? "partial" : "ready" }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
