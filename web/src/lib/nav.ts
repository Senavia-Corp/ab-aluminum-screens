import type { Lang } from './i18n';
import type { ServiceRoute, GalleryRoute } from './routes';

// Presentation metadata for the 4 fixed service routes (nav mega, footer, grids).
export interface ServiceMeta {
  route: ServiceRoute;
  gallery: GalleryRoute;
  label: { en: string; es: string };
  blurb: { en: string; es: string };
  icon: string; // /images/Icon-*.svg
  thumb: string; // /images/*.avif
}

export const SERVICES: ServiceMeta[] = [
  {
    route: 'aluminum-pergolas',
    gallery: 'pergolas',
    label: { en: 'Aluminum Pergolas', es: 'Pérgolas de Aluminio' },
    blurb: {
      en: 'Custom aluminum pergolas & patio covers, engineered for South Florida.',
      es: 'Pérgolas y cubiertas de aluminio a medida, diseñadas para el sur de Florida.',
    },
    icon: '/images/Icon-1.svg',
    thumb: '/images/service-pergola.avif',
  },
  {
    route: 'pool-enclosure',
    gallery: 'pool-enclosure',
    label: { en: 'Pool Enclosures', es: 'Cerramientos de Piscina' },
    blurb: {
      en: 'Screened pool enclosures that keep bugs out and the view in.',
      es: 'Cerramientos de piscina con malla que mantienen los insectos afuera.',
    },
    icon: '/images/Icon-2.svg',
    thumb: '/images/service-pool-enclosure.jpg',
  },
  {
    route: 'patio-screens',
    gallery: 'patio-screens',
    label: { en: 'Patio Screens', es: 'Porches con Malla' },
    blurb: {
      en: 'Screen rooms and patio enclosures for year-round outdoor living.',
      es: 'Porches con malla para disfrutar el exterior todo el año.',
    },
    icon: '/images/Icon-3.svg',
    thumb: '/images/service-patio-screen.avif',
  },
  {
    route: 'louvered-roof-system',
    gallery: 'louvered-roof-systems',
    label: { en: 'Louvered Roof Systems', es: 'Techos de Lamas' },
    blurb: {
      en: 'Motorized louvered roofs — open for sun, close at the first drop of rain.',
      es: 'Techos de lamas motorizados — abre al sol, cierra con la lluvia.',
    },
    icon: '/images/Icon-4.svg',
    thumb: '/images/service-louvered.avif',
  },
];

export function serviceLabel(s: ServiceMeta, lang: Lang) {
  return s.label[lang];
}

// Phone numbers (constant across the site).
export const PHONE = {
  en: { display: '(786) 383-6066', tel: '+17863836066' },
  es: { display: '(786) 340-5157', tel: '+17863405157' },
};

export const SOCIAL = {
  facebook: 'https://www.facebook.com/abaluminumamdscreens/',
  instagram: 'https://www.instagram.com/ab_aluminum/',
  youtube: 'https://www.youtube.com/@abaluminumandscreens',
};

export const EMAIL = 'info@abaluminumandscreens.com';
export const SYNCHRONY = 'https://www.mysynchrony.com/mmc/HQ232228300';
export const SENAVIA = 'https://www.senaviacorp.com/';

// Footer service-area columns — slugs validated against the live serviceArea docs.
// Palm Beach is a service county but has no serviceArea docs yet — add a third { county: Palm Beach, cities }
// block here once those docs exist (so footer links resolve, not 404). {{PENDIENTE: Palm Beach city docs}}
export const FOOTER_AREAS: { county: { en: string; es: string }; cities: { slug: string; name: string }[] }[] = [
  {
    county: { en: 'Miami-Dade', es: 'Miami-Dade' },
    cities: [
      { slug: 'pinecrest', name: 'Pinecrest' },
      { slug: 'palmetto-bay', name: 'Palmetto Bay' },
      { slug: 'coral-gables', name: 'Coral Gables' },
      { slug: 'kendall', name: 'Kendall' },
      { slug: 'cutler-bay', name: 'Cutler Bay' },
      { slug: 'doral', name: 'Doral' },
    ],
  },
  {
    county: { en: 'Broward', es: 'Broward' },
    cities: [
      { slug: 'weston', name: 'Weston' },
      { slug: 'parkland', name: 'Parkland' },
      { slug: 'coral-springs', name: 'Coral Springs' },
      { slug: 'cooper-city', name: 'Cooper City' },
      { slug: 'plantation', name: 'Plantation' },
      { slug: 'pembroke-pines', name: 'Pembroke Pines' },
    ],
  },
];
