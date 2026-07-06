import en from '../i18n/en';
import es from '../i18n/es';

export type Lang = 'en' | 'es';
export const LOCALES: Lang[] = ['en', 'es'];

const dicts = { en, es } as const;

/** Dot-path string lookup with graceful fallback to the key (visible in dev, never throws). */
export function useT(lang: Lang) {
  const d = dicts[lang] ?? en;
  return (path: string): string => {
    const val = path.split('.').reduce<any>((o, k) => (o == null ? o : o[k]), d);
    if (val == null) {
      // fall back to EN, then to the raw key
      const enVal = path.split('.').reduce<any>((o, k) => (o == null ? o : o[k]), en);
      return (enVal as string) ?? path;
    }
    return val as string;
  };
}

/** Which locale a pathname belongs to. */
export function currentLang(pathname: string): Lang {
  return /^\/es(\/|$)/.test(pathname) ? 'es' : 'en';
}

/** The EN ("bare") form of a pathname, e.g. /es/about-us -> /about-us, /es -> /. */
export function barePath(pathname: string): string {
  const stripped = pathname.replace(/^\/es(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

/** Map a pathname to its mirror in the target locale. */
export function toLocale(pathname: string, target: Lang): string {
  const bare = barePath(pathname);
  if (target === 'en') return bare;
  return bare === '/' ? '/es' : `/es${bare}`;
}

/** Localized href for a bare EN path, e.g. localizedHref('/blog', 'es') -> '/es/blog'. */
export function localizedHref(barePathname: string, lang: Lang): string {
  const clean = barePathname.startsWith('/') ? barePathname : `/${barePathname}`;
  return lang === 'en' ? clean : clean === '/' ? '/es' : `/es${clean}`;
}

/** hreflang alternates (en / es / x-default) as absolute URLs. */
export function alternates(pathname: string, siteOrigin: string) {
  const enUrl = new URL(toLocale(pathname, 'en'), siteOrigin).href.replace(/\/$/, '') || siteOrigin;
  const esUrl = new URL(toLocale(pathname, 'es'), siteOrigin).href.replace(/\/$/, '');
  return [
    { hreflang: 'en', href: enUrl },
    { hreflang: 'es', href: esUrl },
    { hreflang: 'x-default', href: enUrl },
  ];
}

/** Pick a localized field with EN fallback: loc(doc, 'summary', lang). */
export function loc<T = any>(doc: any, field: string, lang: Lang): T | undefined {
  if (!doc) return undefined;
  if (lang === 'es') {
    const esVal = doc[`${field}Es`];
    if (esVal != null && !(Array.isArray(esVal) && esVal.length === 0)) return esVal;
  }
  return doc[field];
}
