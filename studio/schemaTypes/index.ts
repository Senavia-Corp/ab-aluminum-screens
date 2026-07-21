import {seo} from './objects/seo'
import {pageImage} from './objects/pageImage'
import {blockContent} from './objects/blockContent'

import {service} from './documents/service'
import {blogPost} from './documents/blogPost'
import {blogCategory} from './documents/blogCategory'
import {serviceArea} from './documents/serviceArea'
import {localService} from './documents/localService'
import {galleryCollection} from './documents/galleryCollection'
import {projectVideo} from './documents/projectVideo'
import {pricingConfig} from './documents/pricingConfig'
import {lead} from './documents/lead'

export const schemaTypes = [
  // objects
  seo,
  pageImage,
  blockContent,
  // documents
  service,
  blogPost,
  blogCategory,
  serviceArea,
  localService,
  galleryCollection,
  projectVideo,
  pricingConfig,
  lead,
]
