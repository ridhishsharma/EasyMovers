import { VendorChangeReviewAdmin } from "@/components/admin/vendor-change-review-admin";

export const dynamic = "force-dynamic";

export default function VendorChangesPage() {
  return <VendorChangeReviewAdmin supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
