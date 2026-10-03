import { FinanceMonthlyCollections } from "@/components/admin/finance-monthly-collections";

export const dynamic="force-dynamic";
export default function FinancePage(){return <FinanceMonthlyCollections supabaseUrl={process.env.SUPABASE_URL||""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY||""}/>;}
