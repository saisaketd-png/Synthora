import { permanentRedirect } from "next/navigation";

export default async function ChemicalsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  permanentRedirect(`/products/${resolvedParams.slug}`);
}
