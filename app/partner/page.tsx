import { PartnerRegistration } from "@/components/moving/partner-registration";
export const dynamic = "force-dynamic";
export default function PartnerPage() {
  return (
    <PartnerRegistration
      supabaseUrl={process.env.SUPABASE_URL || ""}
      publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""}
    />
  );
}
