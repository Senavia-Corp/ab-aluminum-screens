import {defineType, defineField, defineArrayMember} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

/** Form submissions (inline lead form + request-estimate wizard). Written by /api/lead. */
export const lead = defineType({
  name: 'lead',
  title: 'Lead',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'email', type: 'string'}),
    defineField({name: 'phone', type: 'string'}),
    defineField({name: 'locale', type: 'string'}),
    defineField({name: 'type', title: 'Source form', type: 'string'}),
    defineField({name: 'sourcePage', type: 'string'}),
    defineField({name: 'payload', title: 'Answers (JSON)', type: 'text', rows: 10}),
    defineField({
      name: 'photos',
      type: 'array',
      of: [defineArrayMember({type: 'image'})],
    }),
    defineField({name: 'createdAt', type: 'datetime'}),
  ],
  orderings: [
    {title: 'Newest', name: 'newest', by: [{field: 'createdAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'name', subtitle: 'type', date: 'createdAt'},
    prepare: ({title, subtitle}) => ({title: title || 'Lead', subtitle}),
  },
})
