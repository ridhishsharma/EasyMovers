import{PlatformFeeInvoiceAdmin}from"@/components/admin/platform-fee-invoice-admin";
export const dynamic="force-dynamic";
export default function TaxInvoicesPage(){return <PlatformFeeInvoiceAdmin supabaseUrl={process.env.SUPABASE_URL||""} publishableKey={process.env.SUPABASE_PUBLISHABLE_KEY||""}/>;}
