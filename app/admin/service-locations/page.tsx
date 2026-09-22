import { ServiceLocationsAdmin } from "@/components/admin/service-locations-admin";

export const dynamic = "force-dynamic";

export default function ServiceLocationsPage() {
  return <ServiceLocationsAdmin
    supabaseUrl={process.env.SUPABASE_URL || ""}
    publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""}
  />;
}
