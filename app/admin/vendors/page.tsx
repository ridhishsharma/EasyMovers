import { CrmDirectory } from "@/components/admin/crm-directory";

export const dynamic = "force-dynamic";
export default function AdminVendorsPage() {
  return <CrmDirectory kind="vendors" supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
