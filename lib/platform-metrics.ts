export const metricFields = ["successfulMoves", "citiesCovered", "verifiedVendors", "rating"] as const;
export type Metrics = Record<typeof metricFields[number], number | null> & {
  updatedAt: string | null;
  configuration: "ready" | "partial" | "missing" | "invalid";
};

export function parseMetrics(input: unknown): Metrics {
  if (!input || typeof input !== "object") throw Error("Invalid figures response");
  const data = input as Metrics;
  if (!["ready", "partial", "missing", "invalid"].includes(data.configuration)) throw Error("Invalid figures response");
  for (const field of metricFields) {
    const value = data[field];
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
      (field === "rating" ? value > 5 : !Number.isSafeInteger(value)))) throw Error("Invalid figures response");
  }
  if (data.updatedAt !== null && (typeof data.updatedAt !== "string" || !Number.isFinite(Date.parse(data.updatedAt)))) throw Error("Invalid figures response");
  return data;
}
