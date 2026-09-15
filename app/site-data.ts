export type Cabana = {
  slug: string;
  name: string;
  price: number | null;
  capacity: string;
  capacityMax: number | null;
  image: string | null;
  imageAlt: string;
  description: string;
  rooms: string;
  baths: string;
  beds: string;
  amenities: string[];
  accent: string;
  tone: string;
  comingSoon?: boolean;
};

export type BookableCabana = Cabana & {
  price: number;
  capacityMax: number;
  image: string;
};

export const business = {
  name: "Cabañas Rancho La Joya",
  shortName: "Rancho La Joya",
  location: "Amealco de Bonfil, Querétaro",
  phone: "4481038427",
  email: "luisfegon4@hotmail.com",
  alternatePhone: "4421133337",
  whatsapp: "524481038427",
  checkIn: "3:00 p.m.",
  checkOut: "12:00 p.m.",
  depositPercent: 50,
  extraGuestFee: 250,
  minimumNights: 1,
  holidayMinimumNights: 2,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Caba%C3%B1as+Rancho+La+Joya+Amealco",
  instagramUrl: "https://www.instagram.com/cabanasrancholajoya/",
  facebookUrl: null,
  tiktokUrl: null,
  currentSiteUrl: "https://www.cabanasrancholajoya.mx/",
};

export const cabanas: Cabana[] = [
  {
    slug: "zafiro",
    name: "Cabaña Zafiro",
    price: null,
    capacity: "Próximamente",
    capacityMax: null,
    image: null,
    imageAlt: "Fotografía de Cabaña Zafiro próximamente",
    description:
      "Una nueva cabaña de Rancho La Joya está por llegar. Muy pronto podrás conocer sus espacios, capacidad y tarifas.",
    rooms: "Información por confirmar",
    baths: "Información por confirmar",
    beds: "Información por confirmar",
    amenities: [],
    accent: "#4c6b72",
    tone: "stone",
    comingSoon: true,
  },
  {
    slug: "rubi",
    name: "Cabaña Rubí",
    price: 2900,
    capacity: "4–6 personas",
    capacityMax: 6,
    image: "/images/rubi.png",
    imageAlt: "Interior de Cabaña Rubí con chimenea, cocina y sala",
    description:
      "Una cabaña acogedora para desconectarse, cocinar juntos y disfrutar el fuego sin perder la comodidad. Rubí reúne una cama king size, una cama matrimonial y un sofá cama en un espacio íntimo, con terraza, asador y fogatero.",
    rooms: "1 espacio de descanso",
    baths: "Baño completo",
    beds: "King size · matrimonial · sofá cama",
    amenities: ["Chimenea", "Asador", "Terraza", "Fogatero"],
    accent: "#a75d43",
    tone: "clay",
  },
  {
    slug: "gema",
    name: "Cabaña Gema",
    price: 4900,
    capacity: "Hasta 10 personas",
    capacityMax: 10,
    image: "/images/gema.jpg",
    imageAlt: "Exterior de Cabaña Gema entre árboles",
    description:
      "Gema combina el carácter de la piedra y la madera con espacios para compartir. Tiene tres recámaras, cocina equipada, chimenea interior, jardín, área de asador y fogatero para alargar la conversación cuando cae la tarde.",
    rooms: "3 recámaras",
    baths: "1 baño completo",
    beds: "1 cama king size · camas matrimoniales",
    amenities: ["Chimenea interior", "Fogatero", "Asador", "Jardín"],
    accent: "#bd774d",
    tone: "ember",
  },
  {
    slug: "esmeralda",
    name: "Cabaña Esmeralda",
    price: 5000,
    capacity: "Hasta 10 personas",
    capacityMax: 10,
    image: "/images/esmeralda.jpg",
    imageAlt: "Cabaña Esmeralda con jardín y terraza en el bosque",
    description:
      "Esmeralda abre la estancia hacia el jardín y el bosque. Sus tres recámaras, dos baños y áreas comunes hacen de esta cabaña una opción amplia para compartir en familia o con amigos, con cocina equipada, chimenea y asador.",
    rooms: "3 recámaras",
    baths: "2 baños completos",
    beds: "Distribución para grupos",
    amenities: ["Chimenea interior", "Asador", "Jardín", "Cocina equipada"],
    accent: "#72846b",
    tone: "moss",
  },
  {
    slug: "diamante",
    name: "Cabaña Diamante",
    price: 6000,
    capacity: "Hasta 12 personas",
    capacityMax: 12,
    image: "/images/diamante.jpg",
    imageAlt: "Exterior de Cabaña Diamante con terraza y vista al bosque",
    description:
      "Diamante está pensada para reunirse sin prisa. Cuenta con tres recámaras, dos baños, cocina, chimenea, asador, área de reunión y mesa de billar: una base cómoda para pasar el día dentro y seguir disfrutando el bosque alrededor.",
    rooms: "3 recámaras",
    baths: "2 baños completos",
    beds: "Distribución para grupos",
    amenities: ["Chimenea", "Asador", "Área de reunión", "Mesa de billar"],
    accent: "#8a7b64",
    tone: "stone",
  },
];

export function getCabana(slug: string) {
  return cabanas.find((cabana) => cabana.slug === slug);
}

export function isBookable(
  cabana: Cabana,
): cabana is BookableCabana {
  return cabana.price !== null && cabana.capacityMax !== null && Boolean(cabana.image) && !cabana.comingSoon;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function whatsappLink(message: string) {
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
}
