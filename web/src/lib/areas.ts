// County grouping for the service-area cities (the CMS has no county field).
// Palm Beach is a real service county but has no `serviceArea` Sanity docs yet — when the owner adds
// them, list each new slug here under 'Palm Beach' and it appears in the index + footer automatically.
// {{PENDIENTE: Palm Beach city serviceArea docs + slugs}}
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
};

// Palm Beach is listed so the index/footer render it in order as soon as it has cities above.
export const COUNTY_ORDER = ['Miami-Dade', 'Broward', 'Palm Beach'] as const;

export function groupAreasByCounty(areas: { slug: string; title: string }[]) {
  const groups: Record<string, { slug: string; title: string }[]> = {};
  for (const a of areas) {
    const county = COUNTY_BY_SLUG[a.slug] || 'Other';
    (groups[county] ??= []).push(a);
  }
  return COUNTY_ORDER.filter((c) => groups[c]?.length).map((c) => ({
    county: c,
    cities: groups[c].sort((x, y) => x.title.localeCompare(y.title)),
  }));
}
