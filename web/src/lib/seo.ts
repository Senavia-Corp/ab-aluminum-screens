// Stable schema.org @id identifiers for the entity graph. Used by BaseLayout (which DECLARES the
// Organization + LocalBusiness nodes) and by pages (which REFERENCE the business via { '@id': BUSINESS_ID }
// in Service/area schema — never redeclaring the business). @id is a global identifier, not a fetched
// URL, so the production origin is correct in every environment.
export const SITE_ORIGIN = 'https://www.abaluminumandscreens.com';
export const BUSINESS_ID = `${SITE_ORIGIN}/#business`;
export const ORG_ID = `${SITE_ORIGIN}/#org`;
