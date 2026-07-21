import { sanity } from './sanity';
import { SERVICE_ROUTE_TO_SLUG, type ServiceRoute } from './routes';

// Reusable GROQ fragments
const IMG = `{ ..., "alt": alt }`;
const SEO = `seo, seoEs`;

// ---------- Services ----------
export function getServiceBySlug(slug: string) {
  return sanity.fetch(
    `*[_type=="service" && slug.current==$slug][0]{
      title, "slug": slug.current, ${SEO},
      hero{ heading, paragraph, image${IMG} },
      heroEs, introEs, engineeredEs, featuredEs, colorsEs,
      intro{ heading, paragraph },
      pageImages[]${IMG},
      engineered{ heading, paragraph, videoUrl },
      featured{ heading, body, image${IMG} },
      colors{ heading, body, image${IMG} },
      contactImage${IMG}, financingImage${IMG}
    }`,
    { slug },
  );
}

export function getServiceCards() {
  // Lightweight cards for nav mega-menu and homepage/service grids.
  return sanity.fetch(
    `*[_type=="service"]{
      title, titleEs, "slug": slug.current,
      "summary": intro.paragraph, "summaryEs": introEs.paragraph,
      "image": hero.image{ ..., "alt": alt }
    }`,
  );
}

// ---------- Blog ----------
export function getBlogPost(slug: string) {
  return sanity.fetch(
    `*[_type=="blogPost" && slug.current==$slug][0]{
      title, titleEs, "slug": slug.current, author, publishedAt, _updatedAt,
      summary, summaryEs, body, bodyEs, jsonLd, jsonLdEs, ${SEO},
      mainImage{ ..., "alt": alt }, "mainImageUrl": mainImage.asset->url,
      "category": category->{ title, titleEs, "slug": slug.current }
    }`,
    { slug },
  );
}

export function getBlogIndex() {
  return sanity.fetch(
    `*[_type=="blogPost"] | order(publishedAt desc){
      title, titleEs, "slug": slug.current, featured, summary, summaryEs, publishedAt,
      mainImage{ ..., "alt": alt },
      "category": category->{ title, titleEs, "slug": slug.current }
    }`,
  );
}

export function getBlogCategories() {
  return sanity.fetch(`*[_type=="blogCategory"] | order(title asc){ title, titleEs, "slug": slug.current }`);
}

/** Related posts in the same category, excluding the current slug. */
export function getRelatedPosts(categorySlug: string | undefined, excludeSlug: string, limit = 3) {
  if (!categorySlug) return Promise.resolve([]);
  return sanity.fetch(
    `*[_type=="blogPost" && category->slug.current==$cat && slug.current!=$slug] | order(publishedAt desc)[0...$limit]{
      title, titleEs, "slug": slug.current, summary, summaryEs, publishedAt,
      mainImage{ ..., "alt": alt }
    }`,
    { cat: categorySlug, slug: excludeSlug, limit },
  );
}

// ---------- Service Areas ----------
export function getServiceArea(slug: string) {
  return sanity.fetch(
    `*[_type=="serviceArea" && slug.current==$slug][0]{
      title, titleEs, "slug": slug.current, ${SEO},
      titlePage, titlePageEs, descriptionPage, descriptionPageEs,
      pageImageAlts, heading, headingEs, paragraph1, paragraph1Es, paragraph2, paragraph2Es,
      services[]{ paragraph, imageAlt }, servicesEs,
      galleryParagraph, galleryParagraphEs, reviewsParagraph, reviewsParagraphEs,
      financing{ paragraph, imageAlt }, financingEs,
      process{ intro, steps[]{ paragraph, imageAlt } }, processEs,
      contactImageAlt
    }`,
    { slug },
  );
}

export function getServiceAreas() {
  return sanity.fetch(
    `*[_type=="serviceArea"] | order(title asc){ title, titleEs, "slug": slug.current }`,
  );
}

// ---------- Local service pages (service × city) ----------
// One fetch: the localService copy doc + the parent `service` doc's shared images.
export function getLocalService(route: ServiceRoute, citySlug: string) {
  const serviceSlug = SERVICE_ROUTE_TO_SLUG[route];
  return sanity.fetch(
    `*[_type=="localService" && serviceRoute==$route && city->slug.current==$city][0]{
      serviceRoute, "citySlug": city->slug.current, "cityTitle": city->title, "cityTitleEs": city->titleEs,
      h1, h1Es, heroParagraph, heroParagraphEs, heroImageAlt, heroImageAltEs, introHeading, introHeadingEs,
      valueParagraphs[]{ paragraph }, valueParagraphsEs[]{ paragraph }, neighborhoods,
      permitNote, permitNoteEs, localProof, localProofEs, priceRangeNote, priceRangeNoteEs,
      answerQuestion, answerQuestionEs, answerAnswer, answerAnswerEs,
      faqs[]{ "q": question, "a": answer }, faqsEs[]{ "q": question, "a": answer },
      galleryParagraph, galleryParagraphEs, ${SEO},
      "service": *[_type=="service" && slug.current==$serviceSlug][0]{
        hero{ heading, paragraph, image${IMG} },
        pageImages[]${IMG},
        featured{ heading, body, image${IMG} }, featuredEs,
        colors{ heading, body, image${IMG} }, colorsEs,
        contactImage${IMG}, financingImage${IMG}
      }
    }`,
    { route, city: citySlug, serviceSlug },
  );
}

// All (service, city) combos that have a localService doc — for cross-link blocks
// (nearby-same-service, other-services-same-city). Small; fetched once per page.
export function getLocalServiceKeys(): Promise<{ service: string; city: string }[]> {
  return sanity.fetch(
    `*[_type=="localService" && defined(serviceRoute) && defined(city->slug.current)]{
       "service": serviceRoute, "city": city->slug.current }`,
  );
}

// Cities with a localService page for one service — the per-service "areas we serve" hub.
export function getLocalServiceCitiesForRoute(
  route: ServiceRoute,
): Promise<{ slug: string; title: string; titleEs?: string }[]> {
  return sanity.fetch(
    `*[_type=="localService" && serviceRoute==$route && defined(city->slug.current)]{
       "slug": city->slug.current, "title": city->title, "titleEs": city->titleEs } | order(title asc)`,
    { route },
  );
}

// Which services have a localService page for one city — so the city page can deep-link to them.
export function getLocalServiceRoutesForCity(citySlug: string): Promise<string[]> {
  return sanity.fetch(
    `*[_type=="localService" && city->slug.current==$city].serviceRoute`,
    { city: citySlug },
  );
}

// ---------- Galleries ----------
export function getGallery(slug: string) {
  return sanity.fetch(
    `*[_type=="galleryCollection" && slug.current==$slug][0]{
      title, titleEs, "slug": slug.current,
      images[]{ ..., "alt": alt, featured, "lqip": asset->metadata.lqip }
    }`,
    { slug },
  );
}

export function getGalleryPreviews() {
  // First few images per collection for the Our Work hub + homepage gallery section.
  return sanity.fetch(
    `*[_type=="galleryCollection"]{
      title, titleEs, "slug": slug.current,
      "count": count(images),
      "cover": images[0]{ ..., "alt": alt },
      "preview": images[0...6]{ ..., "alt": alt }
    }`,
  );
}

// ---------- Project Videos ----------
export function getProjectVideos() {
  return sanity.fetch(
    `*[_type=="projectVideo"] | order(_createdAt asc){
      title, titleEs, "slug": slug.current, videoUrl, serviceType, city,
      description, descriptionEs, posterImage{ ..., "alt": alt }
    }`,
  );
}

export function getProjectVideo(slug: string) {
  return sanity.fetch(
    `*[_type=="projectVideo" && slug.current==$slug][0]{
      title, titleEs, "slug": slug.current, videoUrl, serviceType, city,
      description, descriptionEs, posterImage{ ..., "alt": alt },
      gallery[]{ ..., "alt": alt },
      "related": *[_type=="projectVideo" && slug.current!=^.slug.current][0...3]{
        title, titleEs, "slug": slug.current, posterImage{ ..., "alt": alt }
      }
    }`,
    { slug },
  );
}

// ---------- Pricing config (estimator) ----------
export function getPricingConfig() {
  return sanity.fetch(`*[_type=="pricingConfig"][0]`);
}
