import {defineType, defineField, defineArrayMember} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export const projectVideo = defineType({
  name: 'projectVideo',
  title: 'Project Video',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'es', title: 'Español'},
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
    defineField({name: 'videoUrl', title: 'Video URL (R2 / MP4)', type: 'url', group: 'content'}),
    defineField({name: 'posterImage', title: 'Poster image', type: 'pageImage', group: 'content'}),
    defineField({name: 'description', type: 'text', rows: 3, group: 'content'}),
    defineField({
      name: 'serviceType',
      title: 'Service type',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Aluminum Pergolas', value: 'Aluminum Pergolas'},
          {title: 'Pool Enclosures', value: 'Pool Enclosures'},
          {title: 'Patio Screens', value: 'Patio Screens'},
          {title: 'Louvered Roof Systems', value: 'Louvered Roof Systems'},
        ],
      },
    }),
    defineField({name: 'city', type: 'string', group: 'content'}),
    defineField({
      name: 'gallery',
      title: 'Photo gallery',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'pageImage'})],
    }),
    // ES
    defineField({name: 'titleEs', title: 'Título (ES)', type: 'string', group: 'es'}),
    defineField({name: 'descriptionEs', title: 'Descripción (ES)', type: 'text', rows: 3, group: 'es'}),
  ],
  preview: {select: {title: 'title', media: 'posterImage'}},
})
