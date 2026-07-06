// Project-estimator pricing model — PER-STRUCTURE modifiers (no shared "cover" multiplier).
// Single source of truth for every number the estimator shows. The Sanity `pricingConfig`
// singleton may override the NUMBERS only (see mergePricing); flow/option lists are code-owned.
// ponytail: a config + a formula, not a pricing engine. Upgrade to tiered/regional only if asked.

export type StructureType = 'pergola' | 'louvered' | 'pool-enclosure' | 'screen-room';
export type Material = 'white' | 'bronze' | 'black' | 'custom';
export type Attachment = 'attached' | 'freestanding';
export type PergolaRoof = 'open-lattice' | 'solid-insulated';
export type LouveredOperation = 'manual' | 'motorized' | 'smart';
export type CageStyle = 'flat' | 'mansard' | 'gable' | 'panoramic';
export type CageHeight = 'single' | 'high';
export type ScreenSubtype = 'under-existing' | 'new-roof' | 'screen-only';
export type Mesh = 'standard' | 'no-see-um' | 'pet' | 'florida-glass';
export type AddOn =
  | 'lighting'
  | 'fans'
  | 'side-screens'
  | 'gutters'
  | 'rain-sensor'
  | 'drainage'
  | 'screen-door'
  | 'kick-plates'
  | 'super-gutter'
  | 'doggy-door';
export type AxisKey = 'roofType' | 'operation' | 'cageStyle' | 'height' | 'subtype';

// The four transparent cost components every project is split into (each a % of subtotal).
export type BreakdownKey = 'engineering' | 'permits' | 'materials' | 'construction';

export interface AddOnOffer {
  key: AddOn;
  /** Only offered while the product's `axis` value is in `oneOf` (e.g. fans need a solid roof). */
  requires?: { axis: AxisKey; oneOf: string[] };
}

export interface StructurePricing {
  basePerSqft: number;
  /** This product's own multiplier axes — a value from another product is simply ignored. */
  axes: Partial<Record<AxisKey, Record<string, number>>>;
  /** Whether the product picks a screen mesh (adds meshPerSqft). */
  mesh: boolean;
  /** Whether attached/freestanding applies (pool cages: no). */
  attachment: boolean;
  /** Finishes this product offers (pool cages: no custom color). */
  colors: Material[];
  /** Add-ons this product can buy, with optional gating on a sub-selection. */
  addOns: AddOnOffer[];
}

export interface PricingConfig {
  structures: Record<StructureType, StructurePricing>;
  /** Additive $/sqft mesh upgrade (pool enclosures + screen rooms). */
  meshPerSqft: Record<Mesh, number>;
  materialMultiplier: Record<Material, number>;
  attachmentMultiplier: Record<Attachment, number>;
  addOnFlat: Record<AddOn, number>;
  // Subtotal is split into these line items (must sum to 1.0).
  breakdownPct: Record<BreakdownKey, number>;
  minSqft: number;
  // +/- band applied to the point estimate to produce the displayed range.
  rangeSpread: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPETITIVE STARTER PRICING — OWNER MUST REVIEW BEFORE GO-LIVE
// Grounded in the 2025–26 Miami-Dade / HVHZ market, set at the affordable end
// of the real range so the site reads as the competitive option. Installed
// $/sqft of footprint. Edit values here (or in Sanity pricingConfig) only.
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_PRICING: PricingConfig = {
  structures: {
    pergola: {
      basePerSqft: 30,
      axes: { roofType: { 'open-lattice': 1.0, 'solid-insulated': 1.7 } },
      mesh: false,
      attachment: true,
      colors: ['white', 'bronze', 'black', 'custom'],
      addOns: [
        { key: 'lighting' },
        { key: 'fans', requires: { axis: 'roofType', oneOf: ['solid-insulated'] } },
        { key: 'side-screens' },
        { key: 'gutters' },
      ],
    },
    louvered: {
      basePerSqft: 85,
      axes: { operation: { manual: 0.85, motorized: 1.0, smart: 1.25 } },
      mesh: false,
      attachment: true,
      colors: ['white', 'bronze', 'black', 'custom'],
      addOns: [
        { key: 'lighting' },
        { key: 'fans' },
        // smart already includes the rain sensor — don't sell it twice
        { key: 'rain-sensor', requires: { axis: 'operation', oneOf: ['manual', 'motorized'] } },
        { key: 'side-screens' },
        { key: 'drainage' },
      ],
    },
    'pool-enclosure': {
      basePerSqft: 24,
      axes: {
        cageStyle: { flat: 1.0, mansard: 1.15, gable: 1.25, panoramic: 1.6 },
        height: { single: 1.0, high: 1.4 },
      },
      mesh: true,
      attachment: false,
      colors: ['white', 'bronze', 'black'],
      addOns: [{ key: 'screen-door' }, { key: 'kick-plates' }, { key: 'super-gutter' }, { key: 'doggy-door' }],
    },
    'screen-room': {
      basePerSqft: 22,
      axes: { subtype: { 'under-existing': 1.0, 'new-roof': 2.4, 'screen-only': 0.8 } },
      mesh: true,
      attachment: true,
      colors: ['white', 'bronze', 'black', 'custom'],
      addOns: [
        { key: 'lighting' },
        { key: 'fans', requires: { axis: 'subtype', oneOf: ['under-existing', 'new-roof'] } },
        { key: 'screen-door' },
        { key: 'kick-plates' },
      ],
    },
  },
  meshPerSqft: { standard: 0, 'no-see-um': 1.5, pet: 2, 'florida-glass': 8 },
  materialMultiplier: { white: 1.0, bronze: 1.05, black: 1.08, custom: 1.15 },
  attachmentMultiplier: { attached: 1.0, freestanding: 1.1 },
  addOnFlat: {
    lighting: 650,
    fans: 450,
    'side-screens': 1200,
    gutters: 450,
    'rain-sensor': 300,
    drainage: 500,
    'screen-door': 350,
    'kick-plates': 450,
    'super-gutter': 700,
    'doggy-door': 250,
  },
  // Permits are a STANDARD line item (not an optional add-on). These must sum to 1.0.
  breakdownPct: {
    materials: 0.46,
    construction: 0.32,
    permits: 0.1,
    engineering: 0.12,
  },
  minSqft: 80,
  rangeSpread: 0.15,
};
// ──────────────────────────── END OWNER-EDITABLE PRICING ─────────────────────

// Display order of the breakdown line items (Design → Permits → Materials → Construction).
export const BREAKDOWN_ORDER: BreakdownKey[] = ['engineering', 'permits', 'materials', 'construction'];

/**
 * Deep-merge a Sanity pricingConfig doc's NUMBERS over the in-code defaults. Docs from the old
 * flat model (basePerSqft/coverMultiplier) lack `structures` and are ignored entirely, so a stale
 * doc can never serve old prices. Arrays/booleans (flow: colors, addOns, gates) stay code-owned.
 */
export function mergePricing(doc: unknown): PricingConfig {
  const d = doc as Record<string, unknown> | null;
  if (!d || typeof d !== 'object' || !d.structures) return DEFAULT_PRICING;
  const over = (def: unknown, o: unknown): unknown => {
    if (typeof def === 'number') return typeof o === 'number' && isFinite(o) ? o : def;
    if (Array.isArray(def)) return def;
    if (def && typeof def === 'object') {
      const r: Record<string, unknown> = {};
      for (const k of Object.keys(def)) r[k] = over((def as any)[k], (o as any)?.[k]);
      return r;
    }
    return def;
  };
  return over(DEFAULT_PRICING, d) as PricingConfig;
}

export interface EstimateInput {
  structure: StructureType;
  sqft: number;
  material: Material;
  attachment?: Attachment;
  // Per-product option set — only the axes the structure declares are priced.
  roofType?: PergolaRoof;
  operation?: LouveredOperation;
  cageStyle?: CageStyle;
  height?: CageHeight;
  subtype?: ScreenSubtype;
  mesh?: Mesh;
  addOns: AddOn[];
}

export interface LineItem {
  key: BreakdownKey;
  amount: number;
  low: number;
  high: number;
}

export interface AddOnLine {
  key: AddOn;
  amount: number;
}

export interface BreakdownResult {
  lineItems: LineItem[];
  addOns: AddOnLine[];
  subtotal: number;
  total: { low: number; high: number; mid: number };
}

export interface EstimateResult {
  low: number;
  high: number;
  mid: number;
}

const round = (n: number, step: number) => Math.round(n / step) * step;

/**
 * Raw, un-rounded subtotal. Only the structure's OWN axes are consulted, so an input polluted
 * with another product's options (or an attachment/mesh/color the product doesn't offer) prices
 * identically to a clean one.
 */
function rawSubtotal(input: EstimateInput, cfg: PricingConfig): number {
  const sc = cfg.structures[input.structure] ?? DEFAULT_PRICING.structures[input.structure];
  if (!sc) return 0;
  const sqft = Math.max(input.sqft || 0, cfg.minSqft);
  let perSqft = sc.basePerSqft ?? 0;
  for (const axis of Object.keys(sc.axes) as AxisKey[]) {
    const v = (input as Record<string, unknown>)[axis];
    perSqft *= (v != null ? sc.axes[axis]?.[String(v)] : undefined) ?? 1;
  }
  if (input.material && sc.colors.includes(input.material)) {
    perSqft *= cfg.materialMultiplier[input.material] ?? 1;
  }
  if (sc.attachment && input.attachment) {
    perSqft *= cfg.attachmentMultiplier[input.attachment] ?? 1;
  }
  if (sc.mesh && input.mesh) {
    perSqft += cfg.meshPerSqft[input.mesh] ?? 0;
  }
  return perSqft * sqft;
}

/** Add-ons the structure actually offers (and whose gate passes), in the product's display order. */
function activeAddOns(input: EstimateInput, cfg: PricingConfig): AddOn[] {
  const sc = cfg.structures[input.structure] ?? DEFAULT_PRICING.structures[input.structure];
  if (!sc) return [];
  const picked = new Set(input.addOns || []);
  return sc.addOns
    .filter((o) => picked.has(o.key))
    .filter((o) => !o.requires || o.requires.oneOf.includes(String((input as Record<string, unknown>)[o.requires.axis] ?? '')))
    .map((o) => o.key);
}

/**
 * Detailed, transparent estimate. Splits the subtotal into 4 line items that SUM EXACTLY to the
 * subtotal (each rounded to $10; the rounding residual is absorbed by the largest line, materials),
 * lists optional add-ons separately, and produces the +/- total range (rounded to $100).
 */
export function estimateBreakdown(input: EstimateInput, cfg: PricingConfig = DEFAULT_PRICING): BreakdownResult {
  const subtotal = Math.round(rawSubtotal(input, cfg));

  // Round every line to the nearest $10, then reconcile so the lines sum to the subtotal exactly.
  const rounded = {} as Record<BreakdownKey, number>;
  for (const key of BREAKDOWN_ORDER) {
    rounded[key] = round(subtotal * (cfg.breakdownPct[key] ?? 0), 10);
  }
  const drift = subtotal - BREAKDOWN_ORDER.reduce((s, k) => s + rounded[k], 0);
  rounded.materials += drift; // materials is the largest line — absorb the rounding residual here

  const lineItems: LineItem[] = BREAKDOWN_ORDER.map((key) => ({
    key,
    amount: rounded[key],
    low: rounded[key],
    high: rounded[key],
  }));

  const addOns: AddOnLine[] = activeAddOns(input, cfg)
    .filter((a) => cfg.addOnFlat[a] != null)
    .map((key) => ({ key, amount: cfg.addOnFlat[key] }));

  const addOnTotal = addOns.reduce((s, a) => s + a.amount, 0);
  const mid = subtotal + addOnTotal;
  const spread = cfg.rangeSpread ?? 0;

  return {
    lineItems,
    addOns,
    subtotal,
    total: {
      low: round(mid * (1 - spread), 100),
      high: round(mid * (1 + spread), 100),
      mid: Math.round(mid),
    },
  };
}

/** Back-compat thin wrapper — returns just the total range. */
export function estimate(input: EstimateInput, cfg: PricingConfig = DEFAULT_PRICING): EstimateResult {
  return estimateBreakdown(input, cfg).total;
}

export function formatUSD(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

// ponytail: one runnable self-check — anchors + invariants. Throws on failure so a CI/node run exits non-zero.
export function demo() {
  let failures = 0;
  const ok = (cond: boolean, msg: string) => {
    if (!cond) {
      failures++;
      console.error('FAIL:', msg);
    }
  };

  // (a) pool cage, flat, single-story, 500 sqft, standard mesh ≈ $12,000
  const pool = estimateBreakdown({
    structure: 'pool-enclosure',
    sqft: 500,
    material: 'white',
    cageStyle: 'flat',
    height: 'single',
    mesh: 'standard',
    addOns: [],
  });
  ok(pool.subtotal === 12000, `pool flat 500sqft expected 12000 got ${pool.subtotal}`);

  // (b) pergola, solid insulated roof, 12×16 (192 sqft): 30 × 1.7 × 192 = 9792, range ±15%
  const perg = estimateBreakdown({
    structure: 'pergola',
    sqft: 192,
    material: 'white',
    attachment: 'attached',
    roofType: 'solid-insulated',
    addOns: [],
  });
  ok(perg.subtotal === 9792, `pergola solid 12×16 expected 9792 got ${perg.subtotal}`);
  ok(perg.total.low === 8300 && perg.total.high === 11300, `pergola range expected 8300–11300 got ${perg.total.low}–${perg.total.high}`);

  // line items sum back to the subtotal exactly
  const sum = perg.lineItems.reduce((s, li) => s + li.amount, 0);
  ok(sum === perg.subtotal, `line items ${sum} must sum to subtotal ${perg.subtotal}`);

  // (c) cross-product immunity: another product's multipliers/options never leak in
  const polluted = estimateBreakdown({
    structure: 'pergola',
    sqft: 192,
    material: 'white',
    attachment: 'attached',
    roofType: 'solid-insulated',
    operation: 'smart',
    cageStyle: 'panoramic',
    height: 'high',
    subtype: 'new-roof',
    mesh: 'florida-glass',
    addOns: ['doggy-door', 'super-gutter'], // not offered on pergolas → ignored
  });
  ok(polluted.subtotal === perg.subtotal, `pergola polluted subtotal ${polluted.subtotal} !== clean ${perg.subtotal}`);
  ok(polluted.total.mid === perg.total.mid, `pergola polluted mid ${polluted.total.mid} !== clean ${perg.total.mid}`);
  const poolFree = estimateBreakdown({ ...({} as any), structure: 'pool-enclosure', sqft: 500, material: 'white', cageStyle: 'flat', height: 'single', mesh: 'standard', attachment: 'freestanding', addOns: [] });
  ok(poolFree.subtotal === pool.subtotal, `pool must ignore attachment: ${poolFree.subtotal} !== ${pool.subtotal}`);
  const poolCustom = estimateBreakdown({ structure: 'pool-enclosure', sqft: 500, material: 'custom', cageStyle: 'flat', height: 'single', mesh: 'standard', addOns: [] });
  ok(poolCustom.subtotal === pool.subtotal, `pool must ignore unoffered custom color: ${poolCustom.subtotal} !== ${pool.subtotal}`);

  // add-on gating: fans on an open-lattice pergola are not sellable
  const gated = estimateBreakdown({
    structure: 'pergola',
    sqft: 192,
    material: 'white',
    attachment: 'attached',
    roofType: 'open-lattice',
    addOns: ['fans', 'lighting'],
  });
  ok(gated.addOns.length === 1 && gated.addOns[0].key === 'lighting', `open-lattice pergola must drop fans, got ${JSON.stringify(gated.addOns)}`);

  // louvered operation ordering + mesh is additive (not multiplied by cage style)
  const lv = (operation: LouveredOperation) =>
    estimateBreakdown({ structure: 'louvered', sqft: 200, material: 'white', attachment: 'attached', operation, addOns: [] }).subtotal;
  ok(lv('manual') < lv('motorized') && lv('motorized') < lv('smart'), 'louvered manual < motorized < smart');
  const poolFG = estimateBreakdown({ structure: 'pool-enclosure', sqft: 500, material: 'white', cageStyle: 'panoramic', height: 'single', mesh: 'florida-glass', addOns: [] });
  ok(poolFG.subtotal === Math.round((24 * 1.6 + 8) * 500), `panoramic + florida-glass expected ${(24 * 1.6 + 8) * 500} got ${poolFG.subtotal}`);

  // old-model Sanity docs are ignored; new-model docs override numbers only
  ok(mergePricing({ basePerSqft: { pergola: 22 }, breakdownPct: {} }) === DEFAULT_PRICING, 'old-shape doc must be ignored');
  const merged = mergePricing({ structures: { pergola: { basePerSqft: 40 } } });
  ok(merged.structures.pergola.basePerSqft === 40, 'merge must take doc number');
  ok(merged.structures.pergola.axes.roofType?.['solid-insulated'] === 1.7, 'merge must keep default axes');
  ok(merged.structures['pool-enclosure'].colors.length === 3, 'merge must keep code-owned flow lists');

  if (failures) throw new Error(`pricing self-check: ${failures} assertion(s) failed`);
  console.log('pricing self-check OK');
  return perg;
}
