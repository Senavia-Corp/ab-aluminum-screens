import {defineType, defineField} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  icon: DocumentTextIcon,
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
    defineField({name: 'featured', title: 'Featured?', type: 'boolean', group: 'content', initialValue: false}),
    defineField({
      name: 'category',
      type: 'reference',
      group: 'content',
      to: [{type: 'blogCategory'}],
    }),
    defineField({name: 'author', type: 'string', group: 'content'}),
    defineField({name: 'mainImage', title: 'Main image', type: 'pageImage', group: 'content'}),
    defineField({name: 'summary', title: 'Post summary', type: 'text', rows: 3, group: 'content'}),
    defineField({name: 'body', title: 'Post body', type: 'blockContent', group: 'content'}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime', group: 'content'}),

    defineField({name: 'seo', type: 'seo', group: 'seo'}),
    defineField({
      name: 'jsonLd',
      title: 'Schema JSON-LD',
      type: 'text',
      rows: 6,
      group: 'seo',
      description: 'Raw JSON-LD to inject into <head> for this post.',
    }),
    // ---- Spanish (AI-translated; English is source of truth) ----
    defineField({name: 'titleEs', title: 'Título (ES)', type: 'string', group: 'es'}),
    defineField({name: 'summaryEs', title: 'Resumen (ES)', type: 'text', rows: 3, group: 'es'}),
    defineField({name: 'bodyEs', title: 'Cuerpo (ES)', type: 'blockContent', group: 'es'}),
    defineField({name: 'seoEs', title: 'SEO (ES)', type: 'seo', group: 'es'}),
    defineField({name: 'jsonLdEs', title: 'Schema JSON-LD (ES)', type: 'text', rows: 6, group: 'es'}),

    defineField({name: 'legacyId', title: 'Webflow Item ID', type: 'string', group: 'seo', readOnly: true}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'category.title', media: 'mainImage'},
  },
})
