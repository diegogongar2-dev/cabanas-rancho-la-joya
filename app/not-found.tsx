import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="site-page">
      <section className="success-page page-width">
        <span className="eyebrow">Rancho La Joya</span>
        <h1>Este camino<br /><em>no existe.</em></h1>
        <p>La cabaña o el enlace que buscas ya no está disponible.</p>
        <Link href="/" className="button button--dark" style={{ marginTop: 28 }}>
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
      </section>
    </main>
  );
}
