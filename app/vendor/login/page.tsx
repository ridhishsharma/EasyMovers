import { VendorLogin } from "@/components/vendor/vendor-login";

export const dynamic = "force-dynamic";

export default function VendorLoginPage() {
  return <VendorLogin supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
