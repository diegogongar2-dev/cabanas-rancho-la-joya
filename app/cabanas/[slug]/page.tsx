import { notFound } from "next/navigation";
import { CabanaDetailExperience } from "../../site-client";
import { cabanas, getCabana } from "../../site-data";

export function generateStaticParams() {
  return cabanas.map((cabana) => ({ slug: cabana.slug }));
}

export default async function CabanaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cabana = getCabana(slug);
  if (!cabana) notFound();
  return <CabanaDetailExperience cabana={cabana} />;
}
