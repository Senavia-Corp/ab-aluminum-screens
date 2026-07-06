/**
 * Seed the new singletons/collections that don't come from the Webflow import:
 *  - projectVideo (4) derived from each service's engineered.videoUrl + hero poster
 *  - pricingConfig (1 singleton) for the Project Estimator
 *
 * Run:  node seed.mjs          (writes)
 *       node seed.mjs --dry    (no writes)
 *
 * Idempotent: deterministic _id, so re-running updates instead of duplicating.
 */
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const CMS_DIR = '/Users/senavia/Sites/ab-aluminum/source/CMS Webflow AB Aluminum And Screens'
const DRY = process.argv.includes('--dry')

const env = Object.fromEntries(
  readFileSync(join(CMS_DIR, 'sanity.env'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)
const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-10-01',
  token: env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const SERVICE_TYPE = {
  'pergolas-patio-covers': 'Aluminum Pergolas',
  'motorized-louvered-roof-systems': 'Louvered Roof Systems',
  'pool-sceen-enclosures': 'Pool Enclosures',
  'patio-screen-rooms': 'Patio Screens',
}
const TITLE = {
  'pergolas-patio-covers': 'Aluminum Pergola Assembly & Install',
  'motorized-louvered-roof-systems': 'Motorized Louvered Roof Assembly',
  'pool-sceen-enclosures': 'Pool Screen Enclosure Build',
  'patio-screen-rooms': 'Patio Screen Room Installation',
}

const main = async () => {
  const services = await client.fetch(
    `*[_type=="service" && defined(engineered.videoUrl)]{ "slug": slug.current, title, "videoUrl": engineered.videoUrl, "poster": hero.image }`,
  )
  console.log(`Found ${services.length} services with videos.`)

  const videoDocs = services.map((s) => ({
    _id: `projectVideo-${s.slug}`,
    _type: 'projectVideo',
    title: TITLE[s.slug] || s.title,
    slug: {_type: 'slug', current: `${s.slug}-build`},
    videoUrl: s.videoUrl,
    serviceType: SERVICE_TYPE[s.slug] || undefined,
    city: 'South Florida',
    description: `Watch our licensed crew assemble and install a ${(SERVICE_TYPE[s.slug] || 'project').toLowerCase()} project in South Florida.`,
    posterImage: s.poster
      ? {_type: 'pageImage', asset: s.poster.asset, alt: s.poster.alt || TITLE[s.slug] || s.title}
      : undefined,
  }))

  const pricing = {
    _id: 'pricingConfig',
    _type: 'pricingConfig',
    title: 'Estimator Pricing',
    basePerSqft: {pergola: 65, louvered: 135, 'pool-enclosure': 22, 'screen-room': 38},
    coverMultiplier: {'open-lattice': 1, 'solid-roof': 1.35, 'motorized-louvers': 1.9, 'screen-only': 0.85},
    materialMultiplier: {white: 1, bronze: 1.06, black: 1.1, custom: 1.18},
    attachmentMultiplier: {attached: 1, freestanding: 1.12},
    addOnFlat: {lighting: 850, fans: 600, screens: 1800, permit: 1200},
    minSqft: 80,
  }

  if (DRY) {
    console.log(JSON.stringify({videoDocs, pricing}, null, 2))
    return
  }
  let tx = client.transaction()
  for (const d of videoDocs) tx = tx.createOrReplace(d)
  tx = tx.createOrReplace(pricing)
  const res = await tx.commit()
  console.log(`Seeded ${videoDocs.length} projectVideo + 1 pricingConfig. (${res.results.length} ops)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
