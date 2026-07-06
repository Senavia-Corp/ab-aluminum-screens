import {defineType, defineField, defineArrayMember} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

/**
 * One document per gallery category (Pergolas, Patio Screens, Louvered Roofs,
 * Pool Enclosures). Holds the ordered set of project photos for that category.
 */
export const galleryCollection = defineType({
  name: 'galleryCollection',
  title: 'Gallery',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'images',
      title: 'Photos',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'pageImage',
          fields: [
            defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
          ],
        }),
      ],
      options: {layout: 'grid'},
    }),
  ],
  preview: {
    select: {title: 'title', images: 'images'},
    prepare({title, images}) {
      const count = images?.length || 0
      return {title, subtitle: `${count} photo${count === 1 ? '' : 's'}`, media: images?.[0]}
    },
  },
})
