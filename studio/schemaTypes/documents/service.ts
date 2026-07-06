import {defineType, defineField, defineArrayMember} from 'sanity'
import {WrenchIcon} from '@sanity/icons'

/**
 * Service landing page (Pergolas, Louvered Roofs, Pool Enclosures, Patio Screens).
 * Sections mirror the page layout 1:1 with the Webflow export.
 */
export const service = defineType({
  name: 'service',
  title: 'Service Page',
  type: 'document',
  icon: WrenchIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'es', title: 'Español'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'title', type: 'string', group: 'content', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'seo', type: 'seo', group: 'seo'}),

    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'paragraph', type: 'text', rows: 3}),
        defineField({name: 'image', type: 'pageImage'}),
      ],
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'paragraph', type: 'text', rows: 4}),
      ],
    }),
    defineField({
      name: 'pageImages',
      title: 'Gallery images (page strip)',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'pageImage'})],
    }),
    defineField({
      name: 'engineered',
      title: 'Engineered / Installed section',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'paragraph', type: 'text', rows: 4}),
        defineField({name: 'videoUrl', title: 'Video URL (R2)', type: 'url'}),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured / Styles section',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'body', title: 'Body (rich text)', type: 'blockContent'}),
        defineField({name: 'image', type: 'pageImage'}),
      ],
    }),
    defineField({
      name: 'colors',
      title: 'Colors / Materials section',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'body', title: 'Body (rich text)', type: 'blockContent'}),
        defineField({name: 'image', type: 'pageImage'}),
      ],
    }),
    defineField({name: 'contactImage', title: 'Contact form image', type: 'pageImage', group: 'content'}),
    defineField({name: 'financingImage', title: 'Financing image', type: 'pageImage', group: 'content'}),

    // ---- Spanish (AI-translated; English is source of truth) ----
    defineField({name: 'titleEs', title: 'Título (ES)', type: 'string', group: 'es'}),
    defineField({
      name: 'heroEs',
      title: 'Hero (ES)',
      type: 'object',
      group: 'es',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'paragraph', type: 'text', rows: 3}),
      ],
    }),
    defineField({
      name: 'introEs',
      title: 'Intro (ES)',
      type: 'object',
      group: 'es',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'paragraph', type: 'text', rows: 4}),
      ],
    }),
    defineField({
      name: 'engineeredEs',
      title: 'Engineered (ES)',
      type: 'object',
      group: 'es',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'paragraph', type: 'text', rows: 4}),
      ],
    }),
    defineField({
      name: 'featuredEs',
      title: 'Featured (ES)',
      type: 'object',
      group: 'es',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'body', type: 'blockContent'}),
      ],
    }),
    defineField({
      name: 'colorsEs',
      title: 'Colors (ES)',
      type: 'object',
      group: 'es',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'body', type: 'blockContent'}),
      ],
    }),
    defineField({name: 'seoEs', title: 'SEO (ES)', type: 'seo', group: 'es'}),

    defineField({name: 'legacyId', title: 'Webflow Item ID', type: 'string', group: 'seo', readOnly: true}),
  ],
  preview: {
    select: {title: 'title', media: 'hero.image'},
  },
})
