import { VendorPortalDashboard } from "@/components/vendor/vendor-portal-dashboard";

export const dynamic = "force-dynamic";

export default function VendorDashboardPage() {
  return <VendorPortalDashboard supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
