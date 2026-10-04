import { LeadWorkspace } from "@/components/admin/lead-workspace";

export const dynamic = "force-dynamic";
export default function AdminLeadsPage() {
  return <LeadWorkspace supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
