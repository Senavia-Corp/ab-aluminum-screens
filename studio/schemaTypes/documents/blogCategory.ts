import {defineType, defineField} from 'sanity'
import {TagIcon} from '@sanity/icons'

export const blogCategory = defineType({
  name: 'blogCategory',
  title: 'Blog Category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'titleEs', title: 'Título (ES)', type: 'string'}),
  ],
})
