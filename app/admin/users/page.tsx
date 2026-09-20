import { CrmUsersAdmin } from "@/components/admin/crm-users-admin";

export const dynamic = "force-dynamic";

export default function CrmUsersPage() {
  return <CrmUsersAdmin supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
