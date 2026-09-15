import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

// Report configuration health without printing environment values or provider errors.
for (const name of ["PUBLIC_SUCCESSFUL_MOVES", "PUBLIC_CITIES_COVERED", "PUBLIC_VERIFIED_VENDORS", "PUBLIC_CUSTOMER_RATING", "PUBLIC_METRICS_UPDATED_AT", "LOCAL_TRANSPORT_RATE_CARD", "NEXT_PUBLIC_GOOGLE_MAPS_PLACES_KEY", "GOOGLE_MAPS_SERVER_KEY"]) {
  const raw = process.env[name];
  let status = raw?.trim() ? "present" : "missing";
  if (status === "present" && name.startsWith("PUBLIC_")) {
    const value = Number(raw);
    const valid = name === "PUBLIC_METRICS_UPDATED_AT" ? Number.isFinite(Date.parse(raw))
      : name === "PUBLIC_CUSTOMER_RATING" ? Number.isFinite(value) && value >= 0 && value <= 5
      : Number.isSafeInteger(value) && value >= 0;
    status = valid ? "valid" : "invalid";
  }
  console.log(`${name}: ${status}`);
}
