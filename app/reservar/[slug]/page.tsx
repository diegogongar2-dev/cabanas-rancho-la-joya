import { notFound } from "next/navigation";
import { ReservationExperience } from "../../site-client";
import { cabanas, getCabana, isBookable } from "../../site-data";

export function generateStaticParams() {
  return cabanas.map((cabana) => ({ slug: cabana.slug }));
}

type ReservationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ entrada?: string; salida?: string; huespedes?: string }>;
};

export default async function ReservationPage({ params, searchParams }: ReservationPageProps) {
  const { slug } = await params;
  const cabana = getCabana(slug);
  if (!cabana || !isBookable(cabana)) notFound();
  const query = searchParams ? await searchParams : {};
  return (
    <ReservationExperience
      cabana={cabana}
      initialEntry={query.entrada || "2026-10-20"}
      initialExit={query.salida || "2026-10-22"}
      initialGuests={query.huespedes || "2"}
    />
  );
}
