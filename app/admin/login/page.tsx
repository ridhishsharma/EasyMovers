import { OfficeLogin } from "@/components/admin/office-login";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return <OfficeLogin supabaseUrl={process.env.SUPABASE_URL || ""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY || ""} />;
}
