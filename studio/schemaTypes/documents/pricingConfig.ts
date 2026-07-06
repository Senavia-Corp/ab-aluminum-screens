import {defineType, defineField} from 'sanity'
import {ControlsIcon} from '@sanity/icons'

const num = (name: string, title: string) => defineField({name, title, type: 'number'})
const obj = (name: string, title: string, fields: any[], collapsed = true) =>
  defineField({name, title, type: 'object', options: {collapsible: true, collapsed}, fields})

/**
 * Singleton config powering the Project Estimator. Mirrors web/src/lib/pricing.ts (PER-STRUCTURE
 * model). Edit NUMBERS here to tune prices without code changes; option lists, colors, add-on
 * availability and gating live in code. Docs saved with the old flat shape (basePerSqft/
 * coverMultiplier at the top level) are IGNORED by the site — re-save with this shape to override.
 */
export const pricingConfig = defineType({
  name: 'pricingConfig',
  title: 'Pricing Config (Estimator)',
  type: 'document',
  icon: ControlsIcon,
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'Estimator Pricing', readOnly: true}),
    obj(
      'structures',
      'Per-structure pricing',
      [
        obj('pergola', 'Aluminum Pergola', [
          num('basePerSqft', 'Base $/sqft (installed)'),
          obj('axes', 'Multipliers', [
            obj('roofType', 'Roof type ×', [num('open-lattice', 'Open lattice'), num('solid-insulated', 'Solid insulated')], false),
          ], false),
        ]),
        obj('louvered', 'Louvered Roof System', [
          num('basePerSqft', 'Base $/sqft (installed)'),
          obj('axes', 'Multipliers', [
            obj('operation', 'Operation ×', [num('manual', 'Manual'), num('motorized', 'Motorized'), num('smart', 'Smart (sensor + app)')], false),
          ], false),
        ]),
        obj('pool-enclosure', 'Pool Enclosure', [
          num('basePerSqft', 'Base $/sqft (footprint, installed)'),
          obj('axes', 'Multipliers', [
            obj('cageStyle', 'Cage style ×', [num('flat', 'Flat / hip'), num('mansard', 'Mansard'), num('gable', 'Gable / dome'), num('panoramic', 'Panoramic')], false),
            obj('height', 'Height ×', [num('single', 'Single-story'), num('high', 'Two-story / high')], false),
          ], false),
        ]),
        obj('screen-room', 'Patio Screen Room', [
          num('basePerSqft', 'Base $/sqft (installed)'),
          obj('axes', 'Multipliers', [
            obj('subtype', 'Room type ×', [num('under-existing', 'Under existing roof'), num('new-roof', 'With new insulated roof'), num('screen-only', 'Screen only (no roof)')], false),
          ], false),
        ]),
      ],
      false,
    ),
    obj('meshPerSqft', 'Screen mesh (+$/sqft)', [
      num('standard', 'Standard 18×14'),
      num('no-see-um', 'No-see-um 20×20'),
      num('pet', 'Pet-resistant'),
      num('florida-glass', 'Florida Glass'),
    ]),
    obj('materialMultiplier', 'Color multiplier', [
      num('white', 'White'),
      num('bronze', 'Bronze'),
      num('black', 'Black'),
      num('custom', 'Custom'),
    ]),
    obj('attachmentMultiplier', 'Attachment multiplier', [
      num('attached', 'Attached'),
      num('freestanding', 'Freestanding'),
    ]),
    obj('addOnFlat', 'Add-on flat prices ($)', [
      num('lighting', 'LED lighting'),
      num('fans', 'Ceiling fans'),
      num('side-screens', 'Retractable side screens'),
      num('gutters', 'Gutters & downspouts'),
      num('rain-sensor', 'Rain sensor'),
      num('drainage', 'Integrated drainage'),
      num('screen-door', 'Screen door'),
      num('kick-plates', 'Kick plates'),
      num('super-gutter', 'Super gutter'),
      num('doggy-door', 'Doggy door'),
    ]),
    obj('breakdownPct', 'Subtotal breakdown (% of subtotal — must sum to 1.0)', [
      num('materials', 'Materials'),
      num('construction', 'Construction'),
      num('permits', 'Permits'),
      num('engineering', 'Engineering'),
    ]),
    num('minSqft', 'Minimum sqft'),
    num('rangeSpread', 'Range spread (e.g. 0.15 = ±15%)'),
  ],
  preview: {select: {title: 'title'}},
})
