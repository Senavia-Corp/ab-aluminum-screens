/**
 * Seed local service (service × city) landing pages into Sanity.
 * Reads ./local-<service>-cities.json and publishes one `localService` doc per city via
 * createOrReplace (idempotent: stable _id per service+city). Images are NOT stored — they come
 * from the parent `service` doc at render time; this doc holds unique local copy only.
 *
 *   node scripts/seed-local-service.mjs --service aluminum-pergolas --dry   # print, don't write
 *   node scripts/seed-local-service.mjs --service aluminum-pergolas         # write + self-check
 *
 * Token: SANITY_WRITE_TOKEN from env, else from the CMS sanity.env (same source seed-palm-beach uses).
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'

const HERE = dirname(fileURLToPath(import.meta.url))
const DRY = process.argv.includes('--dry')
const SERVICE_ROUTES = ['aluminum-pergolas', 'pool-enclosure', 'patio-screens', 'louvered-roof-system']

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const service = argValue('--service')
if (!service || !SERVICE_ROUTES.includes(service)) {
  console.error(`--service must be one of: ${SERVICE_ROUTES.join(', ')}`)
  process.exit(1)
}

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

const cities = JSON.parse(readFileSync(join(HERE, `local-${service}-cities.json`), 'utf8'))
const slugs = cities.map((c) => c.citySlug)

const keyed = (arr, type, mapFn) =>
  (arr || []).map((x, i) => ({ _key: `${type}-${i}`, _type: type, ...mapFn(x) }))

function toDoc(c, cityId) {
  return {
    _id: `localService-${service}-${c.citySlug}`,
    _type: 'localService',
    serviceRoute: service,
    city: { _type: 'reference', _ref: cityId },
    title: c.title,
    // English
    h1: c.h1,
    heroParagraph: c.heroParagraph,
    heroImageAlt: c.heroImageAlt,
    introHeading: c.introHeading,
    valueParagraphs: keyed(c.valueParagraphs, 'valuePara', (s) => ({ paragraph: s })),
    neighborhoods: c.neighborhoods || [],
    permitNote: c.permitNote,
    localProof: c.localProof,
    priceRangeNote: c.priceRangeNote,
    answerQuestion: c.answerQuestion,
    answerAnswer: c.answerAnswer,
    faqs: keyed(c.faqs, 'faqItem', (f) => ({ question: f.question, answer: f.answer })),
    galleryParagraph: c.galleryParagraph,
    seo: { _type: 'seo', metaTitle: c.seo.metaTitle, metaDescription: c.seo.metaDescription },
    // Spanish
    h1Es: c.h1Es,
    heroParagraphEs: c.heroParagraphEs,
    heroImageAltEs: c.heroImageAltEs,
    introHeadingEs: c.introHeadingEs,
    valueParagraphsEs: keyed(c.valueParagraphsEs, 'valueParaEs', (s) => ({ paragraph: s })),
    permitNoteEs: c.permitNoteEs,
    localProofEs: c.localProofEs,
    priceRangeNoteEs: c.priceRangeNoteEs,
    answerQuestionEs: c.answerQuestionEs,
    answerAnswerEs: c.answerAnswerEs,
    faqsEs: keyed(c.faqsEs, 'faqItemEs', (f) => ({ question: f.question, answer: f.answer })),
    galleryParagraphEs: c.galleryParagraphEs,
    seoEs: { _type: 'seo', metaTitle: c.seoEs.metaTitle, metaDescription: c.seoEs.metaDescription },
  }
}

// Rough unique-word count of the local copy (excludes tokens) — thin-content guard.
function uniqueWords(c) {
  const text = [
    c.h1, c.heroParagraph, c.introHeading, ...(c.valueParagraphs || []),
    c.permitNote, c.localProof, c.answerAnswer, ...(c.faqs || []).map((f) => f.answer),
  ].join(' ')
  return text.split(/\s+/).filter(Boolean).length
}

// --- validate content BEFORE writing ---
const problems = []
for (const c of cities) {
  const need = (v, f) => { if (!v || !String(v).trim()) problems.push(`${c.citySlug}: empty ${f}`) }
  need(c.citySlug, 'citySlug'); need(c.title, 'title'); need(c.h1, 'h1')
  need(c.seo?.metaTitle, 'seo.metaTitle'); need(c.seo?.metaDescription, 'seo.metaDescription')
  need(c.seoEs?.metaTitle, 'seoEs.metaTitle'); need(c.seoEs?.metaDescription, 'seoEs.metaDescription')
  if (c.seo?.metaTitle?.length > 70) problems.push(`${c.citySlug}: metaTitle ${c.seo.metaTitle.length}>70`)
  if (c.seo?.metaDescription?.length > 160) problems.push(`${c.citySlug}: metaDescription ${c.seo.metaDescription.length}>160`)
  if (c.seoEs?.metaTitle?.length > 70) problems.push(`${c.citySlug}: seoEs.metaTitle ${c.seoEs.metaTitle.length}>70`)
  if (c.seoEs?.metaDescription?.length > 160) problems.push(`${c.citySlug}: seoEs.metaDescription ${c.seoEs.metaDescription.length}>160`)
  if ((c.valueParagraphs || []).length < 2) problems.push(`${c.citySlug}: needs >=2 valueParagraphs`)
  if ((c.valueParagraphsEs || []).length < 2) problems.push(`${c.citySlug}: needs >=2 valueParagraphsEs`)
  if ((c.faqs || []).length < 3) problems.push(`${c.citySlug}: needs >=3 faqs`)
  if ((c.faqsEs || []).length < 3) problems.push(`${c.citySlug}: needs >=3 faqsEs`)
  const w = uniqueWords(c)
  if (w < 400) problems.push(`${c.citySlug}: only ${w} unique words (<400 — thin content)`)
}
if (problems.length) {
  console.error('Content validation FAILED:\n' + problems.map((p) => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log(`Validated ${cities.length} ${service} cities, 0 content problems.`)

// --- resolve each city's real serviceArea _id by slug (migrated cities use non-deterministic ids) ---
const areaIds = await client.fetch(
  `*[_type=="serviceArea" && slug.current in $slugs]{ "slug": slug.current, _id }`,
  { slugs },
)
const idBySlug = Object.fromEntries(areaIds.map((a) => [a.slug, a._id]))
const missing = slugs.filter((s) => !idBySlug[s])
if (missing.length) {
  console.error(`Missing serviceArea docs for: ${missing.join(', ')}. Seed those cities first.`)
  process.exit(1)
}

if (DRY) {
  for (const c of cities) console.log(`  ~ would createOrReplace localService-${service}-${c.citySlug} (→ ${idBySlug[c.citySlug]})`)
  console.log('--dry: nothing written.')
  process.exit(0)
}

for (const c of cities) {
  await client.createOrReplace(toDoc(c, idBySlug[c.citySlug]))
  console.log(`  ✓ localService-${service}-${c.citySlug} (${c.title})`)
}

// --- self-check: all present, city refs resolve, SEO present ---
const written = await client.fetch(
  `*[_type=="localService" && serviceRoute==$service && city->slug.current in $slugs]{
     "city": city->slug.current, "mt": seo.metaTitle, "md": seo.metaDescription, h1 }`,
  { service, slugs },
)
if (written.length !== slugs.length) {
  console.error(`Self-check FAILED: expected ${slugs.length}, found ${written.length}.`)
  process.exit(1)
}
const bad = written.filter((d) => !d.mt || !d.md || !d.h1 || !d.city)
if (bad.length) {
  console.error('Self-check FAILED: docs missing SEO/h1/city ref: ' + bad.map((d) => d.city).join(', '))
  process.exit(1)
}
console.log(`Self-check OK: ${written.length}/${slugs.length} ${service} pages published with SEO + resolved city refs.`)
