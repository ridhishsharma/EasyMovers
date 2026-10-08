import { ReferenceTracker } from "@/components/moving/reference-tracker";
export const dynamic = "force-dynamic";
export default function TrackPage() {
  return (
    <ReferenceTracker
      supabaseUrl={process.env.SUPABASE_URL || ""}
      publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""}
      phoneOtpEnabled={process.env.ENABLE_CUSTOMER_PHONE_OTP === "true"}
      testOtpEnabled={process.env.ENABLE_CUSTOMER_TEST_OTP === "true"}
    />
  );
}
