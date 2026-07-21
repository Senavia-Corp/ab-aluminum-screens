import {defineType, defineField, defineArrayMember} from 'sanity'
import {RocketIcon} from '@sanity/icons'

/**
 * Local service landing page = ONE service in ONE city (e.g. "Aluminum Pergolas in Miami").
 * Stores UNIQUE local copy + alt strings only; images/video come from the parent `service`
 * doc at render time (same shared-image philosophy as `serviceArea`). The public URL is
 * composed from `serviceRoute` + the referenced city's slug — this doc has no slug of its own.
 * English is source of truth; the `*Es` fields mirror it (AI-translated), resolved by loc().
 */
const paraBlock = {
  type: 'object' as const,
  fields: [defineField({name: 'paragraph', type: 'text', rows: 3})],
  preview: {select: {title: 'paragraph'}},
}
const faqBlock = {
  type: 'object' as const,
  fields: [
    defineField({name: 'question', type: 'string'}),
    defineField({name: 'answer', type: 'text', rows: 3}),
  ],
  preview: {select: {title: 'question'}},
}

export const localService = defineType({
  name: 'localService',
  title: 'Local Service Page (Service × City)',
  type: 'document',
  icon: RocketIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'es', title: 'Español'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // ---- Linking (composes the URL /{serviceRoute}/{city.slug}) ----
    defineField({
      name: 'serviceRoute',
      title: 'Service',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Aluminum Pergolas', value: 'aluminum-pergolas'},
          {title: 'Pool Enclosures', value: 'pool-enclosure'},
          {title: 'Patio Screens', value: 'patio-screens'},
          {title: 'Louvered Roof Systems', value: 'louvered-roof-system'},
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      group: 'content',
      to: [{type: 'serviceArea'}],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'title',
      title: 'Internal label',
      type: 'string',
      description: 'Studio list only, e.g. "Aluminum Pergolas — Miami".',
      group: 'content',
      validation: (r) => r.required(),
    }),

    // ---- Content (EN) ----
    defineField({name: 'h1', title: 'Page title (H1)', type: 'string', group: 'content'}),
    defineField({name: 'heroParagraph', title: 'Hero subtitle', type: 'text', rows: 2, group: 'content'}),
    defineField({name: 'heroImageAlt', title: 'Hero image alt', type: 'string', group: 'content'}),
    defineField({name: 'introHeading', title: 'Local section heading', type: 'string', group: 'content'}),
    defineField({
      name: 'valueParagraphs',
      title: 'Local value paragraphs',
      description: 'The unique, city-specific copy (neighborhoods, permits, salt-air, etc.). 2–3 paragraphs.',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({...paraBlock, name: 'valuePara'})],
    }),
    defineField({
      name: 'neighborhoods',
      title: 'Neighborhoods / landmarks',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({name: 'permitNote', title: 'Permit / code note', type: 'text', rows: 3, group: 'content'}),
    defineField({name: 'localProof', title: 'Local proof line', type: 'text', rows: 2, group: 'content'}),
    defineField({
      name: 'priceRangeNote',
      title: 'Price framing (prose)',
      description: 'Prose only. Use {range} and {perSqft} tokens — real numbers are injected from the estimator engine.',
      type: 'text',
      rows: 2,
      group: 'content',
    }),
    defineField({name: 'answerQuestion', title: 'GEO answer — question', type: 'string', group: 'content'}),
    defineField({name: 'answerAnswer', title: 'GEO answer — answer', type: 'text', rows: 3, group: 'content'}),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({...faqBlock, name: 'faqItem'})],
    }),
    defineField({name: 'galleryParagraph', title: 'Gallery paragraph', type: 'text', rows: 2, group: 'content'}),

    // ---- Spanish (AI-translated; English is source of truth) ----
    defineField({name: 'h1Es', title: 'Título (ES)', type: 'string', group: 'es'}),
    defineField({name: 'heroParagraphEs', title: 'Subtítulo hero (ES)', type: 'text', rows: 2, group: 'es'}),
    defineField({name: 'heroImageAltEs', title: 'Alt imagen hero (ES)', type: 'string', group: 'es'}),
    defineField({name: 'introHeadingEs', title: 'Encabezado local (ES)', type: 'string', group: 'es'}),
    defineField({
      name: 'valueParagraphsEs',
      title: 'Párrafos de valor (ES)',
      type: 'array',
      group: 'es',
      of: [defineArrayMember({...paraBlock, name: 'valueParaEs'})],
    }),
    defineField({name: 'permitNoteEs', title: 'Nota de permisos (ES)', type: 'text', rows: 3, group: 'es'}),
    defineField({name: 'localProofEs', title: 'Prueba local (ES)', type: 'text', rows: 2, group: 'es'}),
    defineField({name: 'priceRangeNoteEs', title: 'Precio (prosa) (ES)', type: 'text', rows: 2, group: 'es'}),
    defineField({name: 'answerQuestionEs', title: 'GEO pregunta (ES)', type: 'string', group: 'es'}),
    defineField({name: 'answerAnswerEs', title: 'GEO respuesta (ES)', type: 'text', rows: 3, group: 'es'}),
    defineField({
      name: 'faqsEs',
      title: 'FAQs (ES)',
      type: 'array',
      group: 'es',
      of: [defineArrayMember({...faqBlock, name: 'faqItemEs'})],
    }),
    defineField({name: 'galleryParagraphEs', title: 'Párrafo galería (ES)', type: 'text', rows: 2, group: 'es'}),
    defineField({name: 'seoEs', title: 'SEO (ES)', type: 'seo', group: 'es'}),

    defineField({name: 'seo', type: 'seo', group: 'seo'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'serviceRoute', city: 'city.title'},
    prepare({title, subtitle, city}) {
      return {title: title || `${subtitle} — ${city || '?'}`, subtitle}
    },
  },
})
