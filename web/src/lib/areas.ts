// County grouping for the service-area cities (the CMS has no county field).
// Each slug listed under its county renders in the index + footer automatically once its
// `serviceArea` doc exists in Sanity. Add new city slugs to the matching county block.
export const COUNTY_BY_SLUG: Record<string, 'Miami-Dade' | 'Broward' | 'Palm Beach'> = {
  // Miami-Dade
  aventura: 'Miami-Dade',
  brickell: 'Miami-Dade',
  'coconut-grove': 'Miami-Dade',
  'coral-gables': 'Miami-Dade',
  'cutler-bay': 'Miami-Dade',
  doral: 'Miami-Dade',
  hialeah: 'Miami-Dade',
  homestead: 'Miami-Dade',
  kendall: 'Miami-Dade',
  'key-biscayne': 'Miami-Dade',
  miami: 'Miami-Dade',
  'miami-beach': 'Miami-Dade',
  'miami-lakes': 'Miami-Dade',
  'north-miami': 'Miami-Dade',
  'north-miami-beach': 'Miami-Dade',
  'palmetto-bay': 'Miami-Dade',
  pinecrest: 'Miami-Dade',
  'sunny-isles-beach': 'Miami-Dade',
  // Broward
  'cooper-city': 'Broward',
  'coral-springs': 'Broward',
  davie: 'Broward',
  'deerfield-beach': 'Broward',
  'fort-lauderdale': 'Broward',
  'hallandale-beach': 'Broward',
  hollywood: 'Broward',
  miramar: 'Broward',
  parkland: 'Broward',
  'pembroke-pines': 'Broward',
  plantation: 'Broward',
  'pompano-beach': 'Broward',
  sunrise: 'Broward',
  weston: 'Broward',
  // Palm Beach
  'west-palm-beach': 'Palm Beach',
  'boca-raton': 'Palm Beach',
  'boynton-beach': 'Palm Beach',
  'delray-beach': 'Palm Beach',
  jupiter: 'Palm Beach',
  'palm-beach-gardens': 'Palm Beach',
  wellington: 'Palm Beach',
  'royal-palm-beach': 'Palm Beach',
  'lake-worth-beach': 'Palm Beach',
  greenacres: 'Palm Beach',
  'riviera-beach': 'Palm Beach',
  'palm-beach': 'Palm Beach',
  'juno-beach': 'Palm Beach',
  tequesta: 'Palm Beach',
  lantana: 'Palm Beach',
};

// Palm Beach is listed so the index/footer render it in order as soon as it has cities above.
export const COUNTY_ORDER = ['Miami-Dade', 'Broward', 'Palm Beach'] as const;

// Wind-load fact per county, for the "rated to X" chip on any city-scoped page.
// Miami-Dade and Broward are Florida's only High-Velocity Hurricane Zones. Palm Beach is a
// wind-borne debris region (~140–170 mph by distance inland) — "HVHZ 175 mph" is simply not its
// code. Lives here next to COUNTY_BY_SLUG because both ServiceAreaPage and LocalServicePage need
// it; when it was inlined in each, only one of them ever got corrected.
export const WIND_BY_COUNTY = {
  'Miami-Dade': { value: '175 mph', label: { en: 'HVHZ wind-rated', es: 'resistencia HVHZ' } },
  Broward: { value: '175 mph', label: { en: 'HVHZ wind-rated', es: 'resistencia HVHZ' } },
  'Palm Beach': { value: '140–170 mph', label: { en: 'wind-borne debris', es: 'escombros por viento' } },
} as const;

// Generic so callers keep their extra fields (titleEs) instead of having them typed away.
export function groupAreasByCounty<T extends { slug: string; title: string }>(areas: T[]) {
  const groups: Record<string, T[]> = {};
  for (const a of areas) {
    const county = COUNTY_BY_SLUG[a.slug] || 'Other';
    (groups[county] ??= []).push(a);
  }
  return COUNTY_ORDER.filter((c) => groups[c]?.length).map((c) => ({
    county: c,
    cities: groups[c].sort((x, y) => x.title.localeCompare(y.title)),
  }));
}
