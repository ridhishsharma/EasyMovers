import { ReferenceTracker } from "@/components/moving/reference-tracker";
export const dynamic = "force-dynamic";
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference = "" } = await searchParams;
  return (
    <ReferenceTracker
      initialReference={reference.slice(0, 85)}
      supabaseUrl={process.env.SUPABASE_URL || ""}
      publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""}
      phoneOtpEnabled={process.env.ENABLE_CUSTOMER_PHONE_OTP === "true"}
    />
  );
}
