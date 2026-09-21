import { CrmDashboard } from "@/components/admin/crm-dashboard";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <CrmDashboard
      supabaseUrl={process.env.SUPABASE_URL || ""}
      publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""}
    />
  );
}
