import { CommercialTermAdmin } from "@/components/admin/commercial-term-admin";

export const dynamic = "force-dynamic";
const statuses = new Set(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);
export default async function CommercialTermsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const value = (await searchParams).status?.toUpperCase() || "PENDING";
  return <CommercialTermAdmin supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} initialStatus={statuses.has(value) ? value : "PENDING"} />;
}
