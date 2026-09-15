"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  House,
  MapPin,
  Menu,
  MessageCircle,
  Mountain,
  Phone,
  ShieldCheck,
  Sparkles,
  Trees,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  business,
  type BookableCabana,
  cabanas,
  formatPrice,
  getCabana,
  isBookable,
  type Cabana,
  whatsappLink,
} from "./site-data";

const money = (value: number) => formatPrice(value).replace(" ", " ");

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title?: string;
      description: string;
      inputSchema: Record<string, unknown>;
      execute: (input: unknown) => unknown | Promise<unknown>;
      annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

type DocumentWithModelContext = Document & { modelContext?: ModelContext };

function useBookingTools({
  selected,
  entry,
  exit,
  guests,
  nights,
  total,
  deposit,
  reservationHref,
}: {
  selected: Cabana;
  entry: string;
  exit: string;
  guests: string;
  nights: number;
  total: number;
  deposit: number;
  reservationHref: string;
}) {
  useEffect(() => {
    const context = (document as DocumentWithModelContext).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      try {
        await context.registerTool(
          {
            name: "get_reservation_quote",
            title: "Get reservation quote",
            description: "Read the selected cabin, dates, guests, total, and expected deposit from the visible booking form.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute: () => ({
              cabana: selected.name,
              entrada: entry,
              salida: exit,
              huespedes: Number(guests),
              noches: nights,
              total_mxn: total,
              anticipo_previsto_mxn: deposit,
              estado: nights > 0 ? "listo_para_solicitar" : "fechas_invalidas",
            }),
          },
          { signal: lifecycle.signal },
        );
        await context.registerTool(
          {
            name: "start_reservation_request",
            title: "Start reservation request",
            description: "Open the reservation request form for the selected cabin and dates shown in the visible booking form.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: () => {
              if (nights <= 0) throw new Error("Selecciona una salida posterior a la entrada.");
              window.location.assign(reservationHref);
              return { status: "started", url: reservationHref };
            },
          },
          { signal: lifecycle.signal },
        );
      } catch {
        // WebMCP is progressive enhancement; the visible form remains usable.
      }
    };
    void register();
    return () => lifecycle.abort();
  }, [deposit, entry, exit, guests, nights, reservationHref, selected, total]);
}

function BookingToolsBridge(props: Parameters<typeof useBookingTools>[0]) {
  useBookingTools(props);
  return null;
}

function nightsBetween(entry: string, exit: string) {
  const start = new Date(`${entry}T12:00:00`);
  const end = new Date(`${exit}T12:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Number.isFinite(days) && days > 0 ? days : 0;
}

function BookingPanel({
  initialCabana = cabanas.find(isBookable)?.slug ?? "rubi",
  compact = false,
}: {
  initialCabana?: string;
  compact?: boolean;
}) {
  const [cabanaSlug, setCabanaSlug] = useState(initialCabana);
  const [entry, setEntry] = useState("2026-10-20");
  const [exit, setExit] = useState("2026-10-22");
  const [guests, setGuests] = useState("2");
  const [checked, setChecked] = useState(false);
  const firstBookable = cabanas.find(isBookable);
  if (!firstBookable) return null;
  const selected = (() => {
    const requested = getCabana(cabanaSlug);
    if (requested && isBookable(requested)) return requested;
    return firstBookable;
  })();
  const nights = nightsBetween(entry, exit);
  const total = nights * selected.price;
  const deposit = Math.round((total * business.depositPercent) / 100);
  const guestOptions = Array.from({ length: selected.capacityMax }, (_, index) => index + 1);
  const reservationHref = `/reservar/${selected.slug}?entrada=${entry}&salida=${exit}&huespedes=${guests}`;

  function checkDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecked(true);
  }

  return (
    <form className={`booking-panel ${compact ? "booking-panel--compact" : ""}`} onSubmit={checkDates}>
      <BookingToolsBridge selected={selected} entry={entry} exit={exit} guests={guests} nights={nights} total={total} deposit={deposit} reservationHref={reservationHref} />
      <div className="booking-panel__heading">
        <div>
          <span className="eyebrow">Tu estancia</span>
          <h2>Consulta fechas</h2>
        </div>
        <CalendarDays aria-hidden="true" size={22} strokeWidth={1.4} />
      </div>
      <div className="booking-fields">
        <label className="field">
          <span>Cabaña</span>
          <select value={cabanaSlug} onChange={(event) => setCabanaSlug(event.target.value)}>
            {cabanas.filter(isBookable).map((cabana) => (
              <option key={cabana.slug} value={cabana.slug}>
                {cabana.name.replace("Cabaña ", "")}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Entrada</span>
          <input type="date" value={entry} onChange={(event) => setEntry(event.target.value)} />
        </label>
        <label className="field">
          <span>Salida</span>
          <input type="date" value={exit} onChange={(event) => setExit(event.target.value)} />
        </label>
        <label className="field">
          <span>Huéspedes</span>
          <select value={guests} onChange={(event) => setGuests(event.target.value)}>
            {guestOptions.map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? "persona" : "personas"}
              </option>
            ))}
          </select>
        </label>
        <button className="button button--dark booking-submit" type="submit">
          Ver cotización <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>
      {checked && nights > 0 ? (
        <div className="quote-row" aria-live="polite">
          <div>
            <span className="quote-row__label">Rango listo para solicitar</span>
            <strong>
              {nights} {nights === 1 ? "noche" : "noches"} · {money(total)}
            </strong>
            <small>Estimado base · anticipo del {business.depositPercent}%: {money(deposit)}</small>
          </div>
          <Link className="button button--outline" href={reservationHref}>
            Continuar <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        </div>
      ) : checked ? (
        <p className="form-error" role="alert">
          Selecciona una salida posterior a la entrada para cotizar tu estancia.
        </p>
      ) : null}
      <p className="booking-note">
        La tarifa final puede variar según la fecha y el número de huéspedes. Persona adicional: {money(business.extraGuestFee)}.
      </p>
    </form>
  );
}

function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={`site-header ${overlay ? "site-header--overlay" : ""}`}>
      <Link href="/" className="brand" onClick={() => setOpen(false)} aria-label="Rancho La Joya, inicio">
        <span className="brand-mark" aria-hidden="true">
          ◇
        </span>
        <span className="brand-copy">
          <strong>Rancho</strong>
          <span>La Joya</span>
        </span>
      </Link>
      <nav className={`site-nav ${open ? "site-nav--open" : ""}`} aria-label="Navegación principal">
        <Link href="/#cabanas" onClick={() => setOpen(false)}>
          Cabañas
        </Link>
        <Link href="/calendario" onClick={() => setOpen(false)}>
          Disponibilidad
        </Link>
        <Link href="/#experiencia" onClick={() => setOpen(false)}>
          La experiencia
        </Link>
        <Link href="/#ubicacion" onClick={() => setOpen(false)}>
          Ubicación
        </Link>
        <Link className="nav-reserve" href="/#reservar" onClick={() => setOpen(false)}>
          Solicitar estancia <ArrowUpRight aria-hidden="true" size={14} />
        </Link>
      </nav>
      <button
        className="menu-toggle"
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
    </header>
  );
}

function CabinCard({ cabana, index }: { cabana: Cabana; index: number }) {
  const hasImage = Boolean(cabana.image);
  return (
    <article className={`cabin-card cabin-card--${cabana.tone} cabin-card--${index + 1}`}>
      <Link href={`/cabanas/${cabana.slug}`} className="cabin-card__image-link" aria-label={`Conocer ${cabana.name}`}>
        {hasImage ? (
          <img src={cabana.image ?? undefined} alt={cabana.imageAlt} className="cabin-card__image" loading="lazy" />
        ) : (
          <span className="cabin-card__placeholder">Próximamente</span>
        )}
        <span className="image-arrow" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="cabin-card__body">
        <div className="cabin-card__topline">
          <span className="cabin-index">0{index + 1}</span>
          <span>{cabana.capacity}</span>
        </div>
        <h3>{cabana.name}</h3>
        <p>{cabana.description}</p>
        <div className="cabin-card__footer">
          {isBookable(cabana) ? <span>Desde <strong>{money(cabana.price)}</strong> / noche</span> : <span><strong>Próximamente</strong></span>}
          <Link href={`/cabanas/${cabana.slug}`} className="text-link">
            {cabana.comingSoon ? "Ver información" : "Ver cabaña"} <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Footer() {
  const message = "Hola, quiero conocer la disponibilidad de Cabañas Rancho La Joya.";
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <span className="eyebrow">Amealco · Querétaro</span>
          <h2>Quédate un poco más cerca de lo esencial.</h2>
        </div>
        <div className="footer-contact">
          <a href={whatsappLink(message)} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" size={17} /> WhatsApp
          </a>
          <a href={`tel:${business.phone}`}>
            <Phone aria-hidden="true" size={17} /> {business.phone}
          </a>
          <a href={business.mapsUrl} target="_blank" rel="noreferrer">
            <MapPin aria-hidden="true" size={17} /> Cómo llegar <ArrowUpRight aria-hidden="true" size={14} />
          </a>
          <Link href="/calendario">
            <CalendarDays aria-hidden="true" size={17} /> Calendario de reservas
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Cabañas Rancho La Joya</span>
        <div>
          <a href={business.instagramUrl} target="_blank" rel="noreferrer">
            Instagram
          </a>
          {business.facebookUrl ? <a href={business.facebookUrl} target="_blank" rel="noreferrer">Facebook</a> : null}
          {business.tiktokUrl ? <a href={business.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a> : null}
          <Link href="/calendario">Disponibilidad</Link>
          <Link href="/admin">Vista de operación</Link>
          <span className="footer-note">Reserva sujeta a confirmación</span>
        </div>
      </div>
    </footer>
  );
}

export function HomeExperience() {
  return (
    <div className="site-page">
      <section className="hero-section">
        <img className="hero-image" src="/images/gema.jpg" alt="Cabaña de piedra y madera entre árboles" />
        <div className="hero-overlay" />
        <SiteHeader overlay />
        <div className="hero-content page-width">
          <div className="hero-kicker">
            <span className="hero-line" />
            <span>Amealco, Querétaro</span>
          </div>
          <h1>
            Tiempo para
            <em> volver.</em>
          </h1>
          <p className="hero-description">
            Cuatro cabañas disponibles en la naturaleza y una nueva experiencia en camino.
          </p>
          <div className="hero-actions">
            <a href="#cabanas" className="button button--light">
              Explorar cabañas <ArrowDown aria-hidden="true" size={16} />
            </a>
            <a href="#reservar" className="hero-text-link">
              Solicitar una estancia <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          </div>
        </div>
        <div className="hero-meta page-width">
          <span>05 cabañas</span>
          <span>04–12 huéspedes</span>
          <span>Desde {money(2900)} MXN</span>
        </div>
      </section>

      <main>
        <section className="intro-section page-width" id="experiencia">
          <div className="intro-mark" aria-hidden="true">
            <Mountain size={30} strokeWidth={1.1} />
          </div>
          <div className="intro-copy">
            <span className="eyebrow">Un refugio a tu ritmo</span>
            <h2>La calma también puede ser un plan.</h2>
            <p>
              Rancho La Joya es un punto de encuentro para disfrutar el bosque, la chimenea, el jardín y las noches alrededor del fogatero. Elige una cabaña, revisa sus espacios y déjanos ayudarte a encontrar tus fechas.
            </p>
            <a href="#reservar" className="text-link text-link--large">
              Ver disponibilidad <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>
          <div className="intro-facts">
            <div>
              <Trees aria-hidden="true" size={21} strokeWidth={1.3} />
              <strong>Naturaleza</strong>
              <span>Entre árboles y aire limpio</span>
            </div>
            <div>
              <Flame aria-hidden="true" size={21} strokeWidth={1.3} />
              <strong>Momentos afuera</strong>
              <span>Asador, jardín y fogatero</span>
            </div>
            <div>
              <ShieldCheck aria-hidden="true" size={21} strokeWidth={1.3} />
              <strong>Claro desde el inicio</strong>
              <span>Cotización según tus fechas</span>
            </div>
          </div>
        </section>

        <section className="cabanas-section page-width" id="cabanas">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Elige tu espacio</span>
              <h2>Cinco formas de quedarse.</h2>
            </div>
            <p>Cuatro cabañas disponibles y una nueva experiencia próximamente.</p>
          </div>
          <div className="cabin-grid">
            {cabanas.map((cabana, index) => (
              <CabinCard key={cabana.slug} cabana={cabana} index={index} />
            ))}
          </div>
        </section>

        <section className="details-band">
          <div className="details-band__image-wrap">
            <img src="/images/esmeralda.jpg" alt="Jardín de Rancho La Joya" className="details-band__image" loading="lazy" />
          </div>
          <div className="details-band__copy">
            <span className="eyebrow">La estancia empieza antes</span>
            <h2>Todo claro para que solo tengas que llegar.</h2>
            <p>
              Revisamos disponibilidad, confirmamos tu solicitud y te compartimos las condiciones de tu estancia antes de apartar las fechas.
            </p>
            <div className="detail-list">
              <div>
                <Clock3 aria-hidden="true" size={20} />
                <span><strong>Entrada</strong>{business.checkIn}</span>
              </div>
              <div>
                <Clock3 aria-hidden="true" size={20} />
                <span><strong>Salida</strong>{business.checkOut}</span>
              </div>
              <div>
                <Check aria-hidden="true" size={20} />
                <span><strong>Para confirmar</strong>Depósito del {business.depositPercent}%</span>
              </div>
              <div>
                <Sparkles aria-hidden="true" size={20} />
                <span><strong>Mascotas</strong>Consulta según cabaña</span>
              </div>
            </div>
          </div>
        </section>

        <section className="booking-section page-width" id="reservar">
          <div className="booking-intro">
            <span className="eyebrow">Reserva directa</span>
            <h2>Empieza por tus fechas.</h2>
            <p>Selecciona una cabaña y recibe una cotización estimada. Tu solicitud queda pendiente hasta que el propietario la confirme.</p>
          </div>
          <BookingPanel />
        </section>

        <section className="location-section page-width" id="ubicacion">
          <div className="location-card">
            <div className="location-card__content">
              <span className="eyebrow">Encuéntranos</span>
              <h2>Un respiro cerca de Amealco.</h2>
              <p>Estamos a pocos minutos del centro de Amealco, Querétaro. Te compartimos la ubicación y las indicaciones al confirmar tu estancia.</p>
              <a className="button button--light" href={business.mapsUrl} target="_blank" rel="noreferrer">
                Abrir Google Maps <ArrowUpRight aria-hidden="true" size={16} />
              </a>
            </div>
            <div className="location-card__stamp" aria-hidden="true">
              <MapPin size={28} strokeWidth={1.1} />
              <span>AMEALCO</span>
              <span>QUERÉTARO</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export function CabanaDetailExperience({ cabana }: { cabana: Cabana }) {
  const otherCabanas = cabanas.filter((item) => item.slug !== cabana.slug).slice(0, 2);
  const bookable = isBookable(cabana);
  return (
    <div className="site-page">
      <SiteHeader />
      <main className="detail-page">
        <div className="detail-hero page-width">
          <div className="detail-hero__image-wrap">
            {cabana.image ? <img src={cabana.image} alt={cabana.imageAlt} className="detail-hero__image" /> : <div className="detail-placeholder">Próximamente</div>}
            <span className="detail-hero__number">01 / 01</span>
          </div>
          <div className="detail-hero__copy">
            <Link href="/#cabanas" className="back-link"><ArrowRight aria-hidden="true" size={15} /> Todas las cabañas</Link>
            <span className="eyebrow">Cabaña {cabana.name.replace("Cabaña ", "")}</span>
            <h1>{cabana.name}</h1>
            <p className="detail-lead">{cabana.description}</p>
            <div className="detail-price">{bookable ? <><strong>Desde {money(cabana.price)}</strong><span>por noche</span></> : <><strong>Próximamente</strong><span>Precio por confirmar</span></>}</div>
            {bookable ? <Link className="button button--dark detail-cta" href={`/reservar/${cabana.slug}`}>
              Solicitar esta cabaña <ArrowUpRight aria-hidden="true" size={16} />
            </Link> : <a className="button button--dark detail-cta" href={whatsappLink("Hola, quiero conocer más sobre Cabaña Zafiro.")} target="_blank" rel="noreferrer">
              Consultar información <MessageCircle aria-hidden="true" size={16} />
            </a>}
            <div className="detail-meta">
              <span><Users aria-hidden="true" size={18} /> {cabana.capacity}</span>
              <span><BedDouble aria-hidden="true" size={18} /> {cabana.beds}</span>
              <span><Bath aria-hidden="true" size={18} /> {cabana.baths}</span>
            </div>
          </div>
        </div>
        <section className="amenities-section page-width">
          <div>
            <span className="eyebrow">Lo que encontrarás</span>
            <h2>{bookable ? "Espacios para habitar el día." : "Estamos preparando sus detalles."}</h2>
          </div>
          <div className="amenities-grid">
            {cabana.amenities.length ? cabana.amenities.map((amenity) => (
              <div className="amenity" key={amenity}><Check aria-hidden="true" size={18} /><span>{amenity}</span></div>
            )) : <p className="amenities-empty">Próximamente compartiremos la capacidad, distribución y amenidades de esta cabaña.</p>}
          </div>
        </section>
        <section className="stay-note page-width">
          <div className="stay-note__icon"><House aria-hidden="true" size={24} strokeWidth={1.2} /></div>
          <div>
            <span className="eyebrow">Información de reservación</span>
            <h2>Una cabaña completa, una solicitud sencilla.</h2>
            <p>{bookable ? <>Elige tus fechas, comparte tus datos y te confirmamos disponibilidad. Para confirmar la estancia se requiere un depósito del {business.depositPercent}%; el resto se liquida máximo el día de ingreso.</> : "Próximamente podrás consultar aquí toda la información de Cabaña Zafiro."}</p>
          </div>
          <div className="stay-note__facts"><span>Entrada <strong>{business.checkIn}</strong></span><span>Salida <strong>{business.checkOut}</strong></span></div>
        </section>
        <section className="more-cabanas page-width">
          <div className="section-heading"><div><span className="eyebrow">También puedes explorar</span><h2>Otros refugios.</h2></div></div>
          <div className="mini-cabin-grid">{otherCabanas.map((item) => <Link key={item.slug} href={`/cabanas/${item.slug}`} className="mini-cabin">{item.image ? <img src={item.image} alt={item.imageAlt} loading="lazy" /> : <div className="mini-cabin__placeholder">Próximamente</div>}<span>{item.name}<ArrowUpRight aria-hidden="true" size={15} /></span></Link>)}</div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

type FormValues = { name: string; phone: string; email: string; comments: string; accepted: boolean };

export function ReservationExperience({ cabana, initialEntry = "2026-10-20", initialExit = "2026-10-22", initialGuests = "2" }: { cabana: BookableCabana; initialEntry?: string; initialExit?: string; initialGuests?: string }) {
  const [entry, setEntry] = useState(initialEntry);
  const [exit, setExit] = useState(initialExit);
  const [guests, setGuests] = useState(initialGuests);
  const [values, setValues] = useState<FormValues>({ name: "", phone: "", email: "", comments: "", accepted: false });
  const [submitted, setSubmitted] = useState(false);
  const nights = nightsBetween(entry, exit);
  const total = nights * cabana.price;
  const deposit = Math.round((total * business.depositPercent) / 100);
  const update = (key: keyof FormValues, value: string | boolean) => setValues((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.name || !values.phone || !values.email || !values.accepted || nights <= 0) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="site-page">
        <SiteHeader />
        <main className="success-page page-width">
          <div className="success-mark"><Check size={28} /></div>
          <span className="eyebrow">Solicitud recibida</span>
          <h1>Tus fechas todavía<br /><em>no están apartadas.</em></h1>
          <p>Gracias, {values.name}. En breve revisaremos la disponibilidad de {cabana.name} y te contactaremos para confirmar la estancia.</p>
          <div className="success-summary">
            <span>Referencia <strong>CAB-DEMO-24031</strong></span>
            <span>{cabana.name} · {nights} noches · {money(total)}</span>
            <span>Anticipo previsto: {money(deposit)}</span>
          </div>
          <div className="success-actions"><Link href="/reserva/demo-rancho-la-joya" className="button button--dark">Consultar estado <ArrowUpRight size={16} /></Link><a href={whatsappLink(`Hola, envié la solicitud CAB-DEMO-24031 para ${cabana.name}.`)} className="button button--outline" target="_blank" rel="noreferrer"><MessageCircle size={16} /> Escribir por WhatsApp</a></div>
          <p className="success-note">En la versión conectada, recibirás también un enlace privado de consulta por correo.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-page">
      <SiteHeader />
      <main className="reservation-page page-width">
        <div className="reservation-heading"><Link href={`/cabanas/${cabana.slug}`} className="back-link"><ArrowRight size={15} /> Volver a {cabana.name}</Link><span className="eyebrow">Solicitud de reservación</span><h1>Planea tu <em>estancia.</em></h1><p>Comparte los datos básicos y te confirmamos disponibilidad antes de apartar tus fechas.</p></div>
        <div className="reservation-layout">
          <form className="reservation-form" onSubmit={submit}>
            <div className="form-section"><div className="form-section__heading"><span>01</span><div><h2>Fechas y huéspedes</h2><p>La salida no ocupa esa noche.</p></div></div><div className="form-grid"><label className="field"><span>Entrada</span><input type="date" value={entry} onChange={(event) => setEntry(event.target.value)} required /></label><label className="field"><span>Salida</span><input type="date" value={exit} onChange={(event) => setExit(event.target.value)} required /></label><label className="field field--full"><span>Huéspedes</span><select value={guests} onChange={(event) => setGuests(event.target.value)}>{Array.from({ length: cabana.capacityMax }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value} {value === 1 ? "persona" : "personas"}</option>)}</select></label></div></div>
            <div className="form-section"><div className="form-section__heading"><span>02</span><div><h2>Tus datos</h2><p>Solo los usaremos para responder tu solicitud.</p></div></div><div className="form-grid"><label className="field field--full"><span>Nombre</span><input value={values.name} onChange={(event) => update("name", event.target.value)} minLength={3} maxLength={80} placeholder="Tu nombre" required /></label><label className="field"><span>Teléfono</span><input value={values.phone} onChange={(event) => update("phone", event.target.value)} inputMode="tel" placeholder="10 dígitos" required /></label><label className="field"><span>Correo</span><input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="tu@correo.com" required /></label><label className="field field--full"><span>Comentarios <small>(opcional)</small></span><textarea value={values.comments} onChange={(event) => update("comments", event.target.value)} maxLength={500} placeholder="Cuéntanos si tienes una hora aproximada de llegada." rows={4} /></label></div></div>
            <div className="form-section form-section--last"><div className="form-section__heading"><span>03</span><div><h2>Confirmación</h2><p>La solicitud queda pendiente hasta ser aprobada.</p></div></div><label className="check-field"><input type="checkbox" checked={values.accepted} onChange={(event) => update("accepted", event.target.checked)} /><span>Acepto las políticas de reservación y el aviso de privacidad vigentes.</span></label><button className="button button--dark form-submit" type="submit">Enviar solicitud <ArrowRight size={16} /></button><p className="form-disclaimer">La reserva no queda apartada hasta recibir el anticipo del {business.depositPercent}%. El saldo se liquida máximo el día de ingreso.</p></div>
          </form>
          <aside className="reservation-summary"><div className="summary-image"><img src={cabana.image} alt={cabana.imageAlt} /></div><div className="summary-content"><span className="eyebrow">Tu cabaña</span><h2>{cabana.name}</h2><div className="summary-line"><span>{cabana.capacity}</span><span>{money(cabana.price)} / noche</span></div><div className="summary-dates"><div><span>Entrada</span><strong>{entry}</strong></div><ArrowRight size={16} /><div><span>Salida</span><strong>{exit}</strong></div></div><div className="summary-total"><span>{nights || 0} noches</span><strong>{money(total)}</strong></div><div className="summary-deposit"><span>Anticipo previsto</span><strong>{money(deposit)}</strong></div><div className="summary-contact"><MapPin size={17} /><span>{business.location}<br />{business.checkIn} — {business.checkOut}</span></div></div></aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

type DemoCalendarStatus = "occupied" | "pending" | "blocked";

const demoCalendar: Record<string, Record<number, DemoCalendarStatus>> = {
  gema: { 8: "blocked" },
  esmeralda: { 20: "pending", 21: "pending" },
  rubi: { 11: "occupied", 12: "occupied" },
  diamante: {},
};

export function CalendarExperience() {
  const firstBookable = cabanas.find(isBookable);
  const [selectedSlug, setSelectedSlug] = useState(firstBookable?.slug ?? "");
  const selected = getCabana(selectedSlug) ?? firstBookable;
  if (!selected) return null;
  const statusByDay = demoCalendar[selected.slug] ?? {};

  return (
    <div className="site-page">
      <SiteHeader />
      <main className="availability-page page-width">
        <div className="availability-heading">
          <Link href="/" className="back-link"><ArrowRight aria-hidden="true" size={15} /> Volver al sitio</Link>
          <span className="eyebrow">Consulta disponibilidad</span>
          <h1>Calendario de <em>reservas.</em></h1>
          <p>Consulta las fechas de cada cabaña y envía tu solicitud. La reserva queda confirmada únicamente después de la revisión del propietario.</p>
        </div>
        <div className="availability-layout">
          <section className="availability-card">
            <div className="availability-card__top">
              <label className="availability-select">
                <span>Cabaña</span>
                <select value={selected.slug} onChange={(event) => setSelectedSlug(event.target.value)}>
                  {cabanas.map((cabana) => <option key={cabana.slug} value={cabana.slug}>{cabana.name.replace("Cabaña ", "")}</option>)}
                </select>
              </label>
              <div className="availability-month"><span>Octubre 2026</span><small>Vista de demostración</small></div>
            </div>
            {selected.comingSoon ? (
              <div className="availability-empty"><span>Próximamente</span><p>Las fechas, capacidad y tarifa de esta cabaña se publicarán cuando estén confirmadas.</p></div>
            ) : (
              <>
                <div className="availability-weekdays">{["L", "M", "M", "J", "V", "S", "D"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
                <div className="availability-days">
                  {Array.from({ length: 35 }, (_, index) => index - 3).map((day, index) => {
                    const status = day > 0 && day <= 31 ? statusByDay[day] : undefined;
                    const label = status === "occupied" ? "Ocupada" : status === "pending" ? "Pendiente" : status === "blocked" ? "No disponible" : "Disponible";
                    return <span key={index} className={`availability-day ${status ? `availability-day--${status}` : ""}`} aria-label={day > 0 && day <= 31 ? `${day} de octubre: ${label}` : undefined}>{day > 0 && day <= 31 ? day : ""}</span>;
                  })}
                </div>
                <div className="availability-legend"><span><i className="availability-legend__available" /> Disponible</span><span><i className="availability-legend__occupied" /> Ocupada</span><span><i className="availability-legend__pending" /> Pendiente</span></div>
              </>
            )}
          </section>
          <aside className="availability-summary">
            <span className="eyebrow">Tu elección</span>
            <h2>{selected.name}</h2>
            <p>{selected.comingSoon ? "Estamos preparando toda la información de esta cabaña." : "Selecciona tus fechas en la página de reservación y te ayudaremos a confirmar tu estancia."}</p>
            {isBookable(selected) ? <div className="availability-summary__facts"><span>Capacidad <strong>{selected.capacity}</strong></span><span>Desde <strong>{money(selected.price)} / noche</strong></span><span>Anticipo <strong>{business.depositPercent}%</strong></span></div> : <div className="availability-summary__facts"><span>Información <strong>Próximamente</strong></span></div>}
            {isBookable(selected) ? <Link className="button button--dark" href={`/reservar/${selected.slug}`}>Solicitar esta cabaña <ArrowUpRight aria-hidden="true" size={16} /></Link> : <a className="button button--dark" href={whatsappLink("Hola, quiero conocer más sobre Cabaña Zafiro.")} target="_blank" rel="noreferrer">Consultar información <MessageCircle aria-hidden="true" size={16} /></a>}
          </aside>
        </div>
        <p className="availability-note">Las fechas de esta vista son una referencia para revisar el flujo. La disponibilidad final deberá ser validada por los propietarios.</p>
      </main>
      <Footer />
    </div>
  );
}

type DemoReservation = { code: string; name: string; cabana: string; dates: string; status: "Pendiente" | "Confirmada" | "Bloqueo"; amount: string; age: string };

export function AdminExperience() {
  const [filter, setFilter] = useState("Todas");
  const [reservations, setReservations] = useState<DemoReservation[]>([
    { code: "CAB-2026-00124", name: "Mariana López", cabana: "Cabaña Esmeralda", dates: "20 — 22 oct", status: "Pendiente", amount: "$10,000", age: "Hace 18 min" },
    { code: "CAB-2026-00118", name: "Carlos y Ana", cabana: "Cabaña Rubí", dates: "11 — 13 oct", status: "Confirmada", amount: "$5,800", age: "Anticipo pendiente" },
    { code: "BLQ-2026-00012", name: "Mantenimiento", cabana: "Cabaña Gema", dates: "08 — 09 oct", status: "Bloqueo", amount: "—", age: "Registrado hoy" },
  ]);
  const filtered = filter === "Todas" ? reservations : reservations.filter((reservation) => reservation.status === filter);
  const decide = (code: string, status: "Confirmada" | "Bloqueo") => setReservations((items) => items.map((item) => item.code === code ? { ...item, status, age: status === "Confirmada" ? "Actualizado ahora" : item.age } : item));
  return (
    <div className="admin-page">
      <aside className="admin-sidebar"><Link href="/" className="brand brand--admin"><span className="brand-mark">◇</span><span className="brand-copy"><strong>Rancho</strong><span>La Joya</span></span></Link><div className="admin-site-label"><span>Operación</span><strong>Panel del propietario</strong></div><nav><a className="admin-nav-item admin-nav-item--active" href="#solicitudes"><CalendarDays size={17} />Solicitudes <span>2</span></a><a className="admin-nav-item" href="#calendario"><CalendarDays size={17} />Calendario</a><a className="admin-nav-item" href="#bloqueos"><ShieldCheck size={17} />Bloqueos</a><a className="admin-nav-item" href="#configuracion"><House size={17} />Configuración</a></nav><div className="admin-sidebar__bottom"><span>Sesión de demostración</span><Link href="/">Volver al sitio <ArrowUpRight size={14} /></Link></div></aside>
      <main className="admin-main"><div className="admin-topbar"><div><span className="eyebrow">Sábado 13 de septiembre, 2026</span><h1>Buenos días, propietario.</h1></div><div className="admin-topbar__actions"><span className="demo-badge">Vista de demostración</span><button className="avatar-button" type="button">RL</button></div></div><div className="demo-notice"><Sparkles size={17} /><span>Esta vista muestra el flujo operativo del MVP con datos de prueba. La versión conectada añadirá autenticación, correo, base de datos y Google Calendar.</span></div><div className="admin-stats"><div className="admin-stat"><span>Solicitudes pendientes</span><strong>1</strong><small>1 reciente · 0 atrasadas</small></div><div className="admin-stat"><span>Próximas llegadas</span><strong>2</strong><small>En los próximos 7 días</small></div><div className="admin-stat"><span>Anticipos por verificar</span><strong>1</strong><small>Acción requerida</small></div><div className="admin-stat admin-stat--alert"><span>Integraciones</span><strong>2</strong><small>Por conectar en producción</small></div></div><section className="admin-section" id="solicitudes"><div className="admin-section__head"><div><span className="eyebrow">Bandeja</span><h2>Solicitudes y ocupaciones</h2></div><div className="filter-tabs">{["Todas", "Pendiente", "Confirmada", "Bloqueo"].map((item) => <button key={item} className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="reservation-list">{filtered.map((item) => <article className="admin-reservation" key={item.code}><div className={`status-dot status-dot--${item.status.toLowerCase()}`} /><div className="admin-reservation__main"><div className="admin-reservation__title"><span>{item.code}</span><strong>{item.name}</strong></div><div className="admin-reservation__meta"><span>{item.cabana}</span><span>{item.dates}</span><span>{item.amount}</span></div></div><span className={`status-pill status-pill--${item.status.toLowerCase()}`}>{item.status}</span><span className="reservation-age">{item.age}</span>{item.status === "Pendiente" ? <div className="admin-actions"><button type="button" onClick={() => decide(item.code, "Confirmada")}>Aprobar</button><button type="button" className="muted" onClick={() => decide(item.code, "Bloqueo")}>Rechazar</button></div> : item.status === "Confirmada" ? <div className="admin-actions"><button type="button" className="muted">Ver detalle</button></div> : null}</article>)}</div></section><section className="admin-grid-section"><div className="calendar-widget" id="calendario"><div className="admin-section__head"><div><span className="eyebrow">Vista mensual</span><h2>Octubre 2026</h2></div><div className="admin-calendar-actions"><Link className="text-link" href="/calendario">Abrir vista <ArrowUpRight size={14} /></Link><ChevronDown size={18} /></div></div><div className="calendar-weekdays">{["L", "M", "M", "J", "V", "S", "D"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="calendar-days">{Array.from({ length: 35 }, (_, index) => { const day = index - 3; return <span key={index} className={`${day === 20 || day === 21 ? "day-booked" : ""} ${day === 11 || day === 12 ? "day-confirmed" : ""}`}>{day > 0 && day <= 31 ? day : ""}</span>; })}</div><div className="calendar-legend"><span><i className="legend-pending" /> Pendiente</span><span><i className="legend-booked" /> Ocupada</span><span><i className="legend-blocked" /> Bloqueo</span></div></div><div className="integration-widget" id="configuracion"><span className="eyebrow">Estado operativo</span><h2>Conexiones</h2><div className="integration-row"><span><MessageCircle size={17} /> WhatsApp</span><strong>Canal de contacto</strong><i className="integration-dot integration-dot--ok" /></div><div className="integration-row"><span><CalendarDays size={17} /> Google Calendar</span><strong>Listo para conectar</strong><i className="integration-dot integration-dot--pending" /></div><div className="integration-row"><span><ShieldCheck size={17} /> Correo</span><strong>Listo para conectar</strong><i className="integration-dot integration-dot--pending" /></div><a href="#configuracion" className="text-link">Abrir configuración <ArrowRight size={15} /></a></div></section></main>
    </div>
  );
}

export function ReservationStatusExperience() {
  return (
    <div className="site-page"><SiteHeader /><main className="status-page page-width"><Link href="/" className="back-link"><ArrowRight size={15} /> Volver al sitio</Link><div className="status-header"><span className="eyebrow">Consulta privada de demostración</span><h1>Solicitud <em>en revisión.</em></h1><p>Esta vista representa el enlace que recibiría el cliente después de enviar su solicitud.</p></div><div className="status-card"><div className="status-card__top"><div><span className="eyebrow">CAB-DEMO-24031</span><h2>Cabaña Rubí</h2></div><span className="status-pill status-pill--pendiente">Pendiente</span></div><div className="status-card__grid"><div><span>Estancia</span><strong>20 — 22 octubre 2026</strong></div><div><span>Huéspedes</span><strong>2 personas</strong></div><div><span>Total</span><strong>$5,800 MXN</strong></div><div><span>Anticipo previsto</span><strong>$2,900 MXN</strong></div></div><div className="status-timeline"><div className="timeline-item timeline-item--active"><i><Check size={14} /></i><div><strong>Solicitud recibida</strong><span>Tu información fue guardada.</span></div></div><div className="timeline-item"><i><Clock3 size={14} /></i><div><strong>Revisión del propietario</strong><span>Te responderemos dentro de 24 horas.</span></div></div><div className="timeline-item"><i><CalendarDays size={14} /></i><div><strong>Confirmación</strong><span>Las fechas se apartan solo después de aprobar.</span></div></div></div><a href={whatsappLink("Hola, quiero consultar mi solicitud CAB-DEMO-24031.")} className="button button--dark" target="_blank" rel="noreferrer"><MessageCircle size={16} /> Contactar por WhatsApp</a></div></main><Footer /></div>
  );
}
