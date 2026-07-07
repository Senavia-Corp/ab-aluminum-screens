/**
 * Seed Palm Beach County service-area (city) pages into Sanity.
 * Reads content from ./pb-cities.json (array of bilingual city objects) and publishes one
 * `serviceArea` doc per city via createOrReplace (idempotent: stable _id per slug).
 *
 * Token: SANITY_WRITE_TOKEN from env, else from the CMS sanity.env (same source translate.mjs uses).
 *
 *   node scripts/seed-palm-beach.mjs --dry   # print, don't write
 *   node scripts/seed-palm-beach.mjs         # write + self-check
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'

const HERE = dirname(fileURLToPath(import.meta.url))
const DRY = process.argv.includes('--dry')

// --- token: env first, then the CMS sanity.env fallback ---
function tokenFromEnvFile() {
  try {
    const p = '/Users/senavia/Sites/ab-aluminum/source/CMS Webflow AB Aluminum And Screens/sanity.env'
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      if (line.startsWith('SANITY_WRITE_TOKEN=')) return line.slice('SANITY_WRITE_TOKEN='.length).trim()
    }
  } catch {}
  return ''
}
const token = process.env.SANITY_WRITE_TOKEN || tokenFromEnvFile()
if (!token) {
  console.error('No SANITY_WRITE_TOKEN (env or sanity.env). Aborting.')
  process.exit(1)
}

const client = createClient({
  projectId: 'zsdw057t',
  dataset: 'production',
  apiVersion: '2024-10-01',
  token,
  useCdn: false,
})

const cities = JSON.parse(readFileSync(join(HERE, 'pb-cities.json'), 'utf8'))
const slugs = cities.map((c) => c.slug)

const sect = (arr, slug, tag, type) =>
  arr.map((s, i) => ({ _key: `${slug}-${tag}-${i}`, _type: type, paragraph: s.paragraph, imageAlt: s.imageAlt }))

function toDoc(c) {
  return {
    _id: `serviceArea-${c.slug}`,
    _type: 'serviceArea',
    title: c.title,
    slug: { _type: 'slug', current: c.slug },
    // English
    titlePage: c.titlePage,
    descriptionPage: c.descriptionPage,
    heading: c.heading,
    paragraph1: c.paragraph1,
    paragraph2: c.paragraph2,
    services: sect(c.services, c.slug, 'svc', 'serviceBlock'),
    galleryParagraph: c.galleryParagraph,
    reviewsParagraph: c.reviewsParagraph,
    financing: { paragraph: c.financing.paragraph, imageAlt: c.financing.imageAlt },
    process: { intro: c.process.intro, steps: sect(c.process.steps, c.slug, 'ps', 'processStep') },
    contactImageAlt: c.contactImageAlt,
    pageImageAlts: c.pageImageAlts,
    seo: { _type: 'seo', metaTitle: c.seo.metaTitle, metaDescription: c.seo.metaDescription },
    // Spanish
    titleEs: c.titleEs,
    titlePageEs: c.titlePageEs,
    descriptionPageEs: c.descriptionPageEs,
    headingEs: c.headingEs,
    paragraph1Es: c.paragraph1Es,
    paragraph2Es: c.paragraph2Es,
    servicesEs: sect(c.servicesEs, c.slug, 'svce', 'serviceBlockEs'),
    galleryParagraphEs: c.galleryParagraphEs,
    reviewsParagraphEs: c.reviewsParagraphEs,
    financingEs: { paragraph: c.financingEs.paragraph, imageAlt: c.financingEs.imageAlt },
    processEs: { intro: c.processEs.intro, steps: sect(c.processEs.steps, c.slug, 'pse', 'processStepEs') },
    seoEs: { _type: 'seo', metaTitle: c.seoEs.metaTitle, metaDescription: c.seoEs.metaDescription },
  }
}

// --- validate content BEFORE writing (SEO fields are mandatory for indexing) ---
const problems = []
for (const c of cities) {
  const need = (v, f) => { if (!v || !String(v).trim()) problems.push(`${c.slug}: empty ${f}`) }
  need(c.title, 'title'); need(c.slug, 'slug'); need(c.titlePage, 'titlePage')
  need(c.seo?.metaTitle, 'seo.metaTitle'); need(c.seo?.metaDescription, 'seo.metaDescription')
  need(c.seoEs?.metaTitle, 'seoEs.metaTitle'); need(c.seoEs?.metaDescription, 'seoEs.metaDescription')
  if (c.seo?.metaTitle?.length > 70) problems.push(`${c.slug}: metaTitle ${c.seo.metaTitle.length}>70`)
  if (c.seo?.metaDescription?.length > 160) problems.push(`${c.slug}: metaDescription ${c.seo.metaDescription.length}>160`)
  if (c.seoEs?.metaTitle?.length > 70) problems.push(`${c.slug}: seoEs.metaTitle ${c.seoEs.metaTitle.length}>70`)
  if (c.seoEs?.metaDescription?.length > 160) problems.push(`${c.slug}: seoEs.metaDescription ${c.seoEs.metaDescription.length}>160`)
}
if (problems.length) {
  console.error('Content validation FAILED:\n' + problems.map((p) => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log(`Validated ${cities.length} cities, 0 problems.`)

if (DRY) {
  for (const c of cities) console.log(`  ~ would createOrReplace serviceArea-${c.slug} (${c.title})`)
  console.log('--dry: nothing written.')
  process.exit(0)
}

for (const c of cities) {
  await client.createOrReplace(toDoc(c))
  console.log(`  ✓ serviceArea-${c.slug} (${c.title})`)
}

// --- self-check: all present, none with empty SEO in the actual dataset ---
const written = await client.fetch(
  `*[_type=="serviceArea" && slug.current in $slugs]{ "slug": slug.current, "mt": seo.metaTitle, "md": seo.metaDescription, titlePage }`,
  { slugs },
)
if (written.length !== slugs.length) {
  console.error(`Self-check FAILED: expected ${slugs.length}, found ${written.length} in Sanity.`)
  process.exit(1)
}
const bad = written.filter((d) => !d.mt || !d.md || !d.titlePage)
if (bad.length) {
  console.error('Self-check FAILED: docs missing SEO fields: ' + bad.map((d) => d.slug).join(', '))
  process.exit(1)
}
console.log(`Self-check OK: ${written.length}/${slugs.length} Palm Beach cities published with SEO fields.`)
