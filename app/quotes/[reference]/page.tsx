import { CustomerQuotationComparison } from "@/components/moving/customer-quotation-comparison";
export default async function CustomerQuotesPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <CustomerQuotationComparison reference={reference}/>;
}
