import { getTools } from "@/lib/tools";
import { toolComponents, toolSlugs } from "@/lib/tools-generated";
import { notFound } from "next/navigation";

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return toolSlugs.map((slug) => ({ slug }));
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tool = getTools().find((t) => t.slug === slug);
  if (!tool) notFound();

  const entry = toolComponents[slug];
  if (!entry) notFound();

  const Component = entry.Component;
  return <Component />;
}
