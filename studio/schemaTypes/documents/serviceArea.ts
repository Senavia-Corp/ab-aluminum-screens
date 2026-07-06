import {defineType, defineField, defineArrayMember} from 'sanity'
import {PinIcon} from '@sanity/icons'

/**
 * City landing page (Aventura, Doral, ...). The Webflow export carries copy +
 * per-section alt text only — images are a shared site template, so we store the
 * alt strings (apply them to the shared images at render time).
 */
const sectionWithAlt = {
  type: 'object' as const,
  fields: [
    defineField({name: 'paragraph', type: 'text', rows: 3}),
    defineField({name: 'imageAlt', title: 'Image alt text', type: 'string'}),
  ],
}

export const serviceArea = defineType({
  name: 'serviceArea',
  title: 'Service Area (City)',
  type: 'document',
  icon: PinIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'es', title: 'Español'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'title', title: 'City', type: 'string', group: 'content', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'titlePage', title: 'Page title (H1)', type: 'string', group: 'content'}),
    defineField({name: 'descriptionPage', title: 'Page description', type: 'text', rows: 3, group: 'content'}),
    defineField({
      name: 'pageImageAlts',
      title: 'Hero image alt texts',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      group: 'content',
    }),
    defineField({name: 'heading', title: 'Heading 1', type: 'string', group: 'content'}),
    defineField({name: 'paragraph1', type: 'text', rows: 3, group: 'content'}),
    defineField({name: 'paragraph2', type: 'text', rows: 3, group: 'content'}),
    defineField({
      name: 'services',
      title: 'Services sections',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({...sectionWithAlt, name: 'serviceBlock'})],
    }),
    defineField({name: 'galleryParagraph', title: 'Gallery paragraph', type: 'text', rows: 2, group: 'content'}),
    defineField({name: 'reviewsParagraph', title: 'Reviews paragraph', type: 'text', rows: 2, group: 'content'}),
    defineField({
      name: 'financing',
      title: 'Financing section',
      type: 'object',
      group: 'content',
      fields: sectionWithAlt.fields,
    }),
    defineField({
      name: 'process',
      title: 'Process section',
      type: 'object',
      group: 'content',
      fields: [
        defineField({name: 'intro', title: 'Intro paragraph', type: 'text', rows: 2}),
        defineField({
          name: 'steps',
          type: 'array',
          of: [defineArrayMember({...sectionWithAlt, name: 'processStep'})],
        }),
      ],
    }),
    defineField({name: 'contactImageAlt', title: 'Contact image alt', type: 'string', group: 'content'}),

    // ---- Spanish (AI-translated; English is source of truth) ----
    defineField({name: 'titleEs', title: 'Ciudad (ES)', type: 'string', group: 'es'}),
    defineField({name: 'titlePageEs', title: 'Título de página (ES)', type: 'string', group: 'es'}),
    defineField({name: 'descriptionPageEs', title: 'Descripción (ES)', type: 'text', rows: 3, group: 'es'}),
    defineField({name: 'headingEs', title: 'Encabezado (ES)', type: 'string', group: 'es'}),
    defineField({name: 'paragraph1Es', type: 'text', rows: 3, group: 'es'}),
    defineField({name: 'paragraph2Es', type: 'text', rows: 3, group: 'es'}),
    defineField({
      name: 'servicesEs',
      title: 'Services sections (ES)',
      type: 'array',
      group: 'es',
      of: [defineArrayMember({...sectionWithAlt, name: 'serviceBlockEs'})],
    }),
    defineField({name: 'galleryParagraphEs', type: 'text', rows: 2, group: 'es'}),
    defineField({name: 'reviewsParagraphEs', type: 'text', rows: 2, group: 'es'}),
    defineField({
      name: 'financingEs',
      title: 'Financing (ES)',
      type: 'object',
      group: 'es',
      fields: sectionWithAlt.fields,
    }),
    defineField({
      name: 'processEs',
      title: 'Process (ES)',
      type: 'object',
      group: 'es',
      fields: [
        defineField({name: 'intro', type: 'text', rows: 2}),
        defineField({name: 'steps', type: 'array', of: [defineArrayMember({...sectionWithAlt, name: 'processStepEs'})]}),
      ],
    }),
    defineField({name: 'seoEs', title: 'SEO (ES)', type: 'seo', group: 'es'}),

    defineField({name: 'seo', type: 'seo', group: 'seo'}),
    defineField({name: 'legacyId', title: 'Webflow Item ID', type: 'string', group: 'seo', readOnly: true}),
  ],
  preview: {select: {title: 'title', subtitle: 'titlePage'}},
})
