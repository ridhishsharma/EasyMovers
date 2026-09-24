import { VendorOperationsAdmin } from "@/components/admin/vendor-operations-admin";

export const dynamic = "force-dynamic";
export default function AdminVendorsPage() {
  return <VendorOperationsAdmin supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
