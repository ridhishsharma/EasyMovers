import { DraftEditor } from "@/components/moving/draft-editor";
export default async function DraftPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return <DraftEditor reference={reference} />;
}
