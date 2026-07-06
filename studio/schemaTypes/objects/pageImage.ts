import {defineType, defineField} from 'sanity'

/**
 * Image + required alt text. Reused everywhere an image appears so editors
 * always get a hotspot and an SEO alt field.
 */
export const pageImage = defineType({
  name: 'pageImage',
  title: 'Image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text (SEO)',
      type: 'string',
      validation: (rule) => rule.required().warning('Alt text is important for SEO'),
    }),
  ],
  preview: {
    select: {media: 'asset', title: 'alt'},
  },
})
