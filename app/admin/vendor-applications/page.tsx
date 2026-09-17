import { VendorApplicationsAdmin } from "@/components/admin/vendor-applications-admin";

export const dynamic = "force-dynamic";

export default function VendorApplicationsPage() {
  return (
    <VendorApplicationsAdmin
      supabaseUrl={process.env.SUPABASE_URL || ""}
      publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""}
    />
  );
}
