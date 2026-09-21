import { CrmDirectory } from "@/components/admin/crm-directory";

export const dynamic = "force-dynamic";
export default function AdminLeadsPage() {
  return <CrmDirectory kind="leads" supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
