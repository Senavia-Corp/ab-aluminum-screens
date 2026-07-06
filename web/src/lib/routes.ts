import { sanity } from './sanity';

// Public service routes -> live Sanity service slugs (slugs differ; keep explicit).
export const SERVICE_ROUTE_TO_SLUG = {
  'aluminum-pergolas': 'pergolas-patio-covers',
  'louvered-roof-system': 'motorized-louvered-roof-systems',
  'pool-enclosure': 'pool-sceen-enclosures', // sic — typo is in the CMS data
  'patio-screens': 'patio-screen-rooms',
} as const;

export type ServiceRoute = keyof typeof SERVICE_ROUTE_TO_SLUG;

// Display order + icon hint for the 4 services (nav mega-menu, service grids).
export const SERVICE_ROUTES: ServiceRoute[] = [
  'aluminum-pergolas',
  'pool-enclosure',
  'patio-screens',
  'louvered-roof-system',
];

// Public gallery routes -> live Sanity galleryCollection slugs.
export const GALLERY_ROUTE_TO_SLUG = {
  pergolas: 'pergolas',
  'pool-enclosure': 'pool-enclosures',
  'patio-screens': 'patio-screens',
  'louvered-roof-systems': 'louvered-roofs',
} as const;

export type GalleryRoute = keyof typeof GALLERY_ROUTE_TO_SLUG;
export const GALLERY_ROUTES: GalleryRoute[] = [
  'pergolas',
  'pool-enclosure',
  'patio-screens',
  'louvered-roof-systems',
];

// Which gallery route pairs with which service route (cross-links).
export const SERVICE_TO_GALLERY: Record<ServiceRoute, GalleryRoute> = {
  'aluminum-pergolas': 'pergolas',
  'pool-enclosure': 'pool-enclosure',
  'patio-screens': 'patio-screens',
  'louvered-roof-system': 'louvered-roof-systems',
};

// ---- getStaticPaths helpers (each [param] route file calls one of these) ----

export async function blogPaths() {
  const slugs: string[] = await sanity.fetch(
    `*[_type=="blogPost" && defined(slug.current)].slug.current`,
  );
  return slugs.map((slug) => ({ params: { slug } }));
}

export async function areaPaths() {
  const slugs: string[] = await sanity.fetch(
    `*[_type=="serviceArea" && defined(slug.current)].slug.current`,
  );
  return slugs.map((slug) => ({ params: { city: slug } }));
}

export async function videoPaths() {
  const slugs: string[] = await sanity.fetch(
    `*[_type=="projectVideo" && defined(slug.current)].slug.current`,
  );
  return slugs.map((slug) => ({ params: { slug } }));
}

export function galleryPaths() {
  return GALLERY_ROUTES.map((collection) => ({ params: { collection } }));
}
