import { VendorSettlementAdmin } from "@/components/admin/vendor-settlement-admin";

export const dynamic = "force-dynamic";
const statuses = new Set(["PENDING", "PROCESSING", "SETTLED", "FAILED", "REJECTED", "ALL"]);
export default async function VendorSettlementsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const value = (await searchParams).status?.toUpperCase() || "PENDING";
  return <VendorSettlementAdmin supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} initialStatus={statuses.has(value) ? value : "PENDING"} />;
}
