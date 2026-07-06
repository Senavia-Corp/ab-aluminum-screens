/**
 * Full EN -> ES translation of all CMS content into the `*Es` fields.
 * English stays the source of truth; output is for client review in the Studio.
 *
 * Requires an Anthropic API key (the user's own — pass it in the environment):
 *   ANTHROPIC_API_KEY=sk-ant-... node translate.mjs
 *
 * Flags:
 *   --dry            don't write, print what would change
 *   --only=blogPost  restrict to one type (service|serviceArea|blogPost|blogCategory)
 *   --limit=5        cap docs per type (for a test run)
 *   --model=...      override model (default claude-sonnet-4-6)
 *
 * Idempotent: re-running overwrites the ES fields only. Structure-preserving for
 * Portable Text (only span text is translated; blocks/marks/links/images kept).
 */
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import Anthropic from '@anthropic-ai/sdk'

const CMS_DIR = '/Users/senavia/Sites/ab-aluminum/source/CMS Webflow AB Aluminum And Screens'
const DRY = process.argv.includes('--dry')
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1]
const LIMIT = parseInt((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '0')
const MODEL = (process.argv.find((a) => a.startsWith('--model=')) || '').split('=')[1] || 'claude-sonnet-4-6'

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

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Set ANTHROPIC_API_KEY in the environment to run the translation.')
  process.exit(1)
}
const ai = new Anthropic()

const SYSTEM =
  'You are a professional EN->ES translator for a South Florida aluminum contractor (pergolas, ' +
  'pool enclosures, screen rooms, louvered roofs). Translate to natural, marketing-quality Latin ' +
  'American Spanish (US Hispanic audience). Keep proper nouns, brand names, phone numbers and city ' +
  'names. Return ONLY a JSON object mapping each input key to its translated string — no commentary.'

/** Translate a flat {key: englishText} map -> {key: spanishText}. */
async function translateMap(map) {
  const keys = Object.keys(map).filter((k) => map[k] && String(map[k]).trim())
  if (!keys.length) return {}
  const input = Object.fromEntries(keys.map((k) => [k, map[k]]))
  const msg = await ai.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{role: 'user', content: 'Translate the values to Spanish:\n' + JSON.stringify(input)}],
  })
  const text = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  return JSON.parse(json)
}

// ---- Portable Text helpers ----
function ptToMap(blocks, prefix) {
  const map = {}
  ;(blocks || []).forEach((b, bi) => {
    if (b._type === 'block') (b.children || []).forEach((c, ci) => { if (c.text?.trim()) map[`${prefix}.${bi}.${ci}`] = c.text })
  })
  return map
}
function ptApply(blocks, prefix, tr) {
  return (blocks || []).map((b, bi) => {
    if (b._type !== 'block') return b
    return {...b, children: (b.children || []).map((c, ci) => {
      const k = `${prefix}.${bi}.${ci}`
      return tr[k] ? {...c, text: tr[k]} : c
    })}
  })
}

const limit = (arr) => (LIMIT ? arr.slice(0, LIMIT) : arr)

async function run(type, handler) {
  if (ONLY && ONLY !== type) return
  const docs = await client.fetch(`*[_type==$type]`, {type})
  console.log(`\n== ${type}: ${docs.length} docs ${LIMIT ? `(limit ${LIMIT})` : ''}`)
  for (const doc of limit(docs)) {
    try {
      const patch = await handler(doc)
      if (!patch || !Object.keys(patch).length) { console.log(`  - ${doc.title || doc._id}: nothing`); continue }
      if (DRY) console.log(`  ~ ${doc.title || doc._id}: would set ${Object.keys(patch).join(', ')}`)
      else { await client.patch(doc._id).set(patch).commit(); console.log(`  ✓ ${doc.title || doc._id}`) }
    } catch (e) {
      console.error(`  ✗ ${doc.title || doc._id}:`, e.message)
    }
  }
}

await run('blogCategory', async (d) => {
  const tr = await translateMap({title: d.title})
  return tr.title ? {titleEs: tr.title} : {}
})

await run('service', async (d) => {
  const flat = {
    title: d.title,
    hero_h: d.hero?.heading, hero_p: d.hero?.paragraph,
    intro_h: d.intro?.heading, intro_p: d.intro?.paragraph,
    eng_h: d.engineered?.heading, eng_p: d.engineered?.paragraph,
    feat_h: d.featured?.heading, colors_h: d.colors?.heading,
    seo_t: d.seo?.metaTitle, seo_d: d.seo?.metaDescription,
    ...ptToMap(d.featured?.body, 'featbody'),
    ...ptToMap(d.colors?.body, 'colorsbody'),
  }
  const tr = await translateMap(flat)
  return {
    titleEs: tr.title,
    heroEs: {heading: tr.hero_h, paragraph: tr.hero_p},
    introEs: {heading: tr.intro_h, paragraph: tr.intro_p},
    engineeredEs: {heading: tr.eng_h, paragraph: tr.eng_p},
    featuredEs: {heading: tr.feat_h, body: ptApply(d.featured?.body, 'featbody', tr)},
    colorsEs: {heading: tr.colors_h, body: ptApply(d.colors?.body, 'colorsbody', tr)},
    seoEs: {metaTitle: tr.seo_t, metaDescription: tr.seo_d},
  }
})

await run('serviceArea', async (d) => {
  const flat = {
    title: d.title, titlePage: d.titlePage, descriptionPage: d.descriptionPage,
    heading: d.heading, p1: d.paragraph1, p2: d.paragraph2,
    galleryP: d.galleryParagraph, reviewsP: d.reviewsParagraph,
    fin_p: d.financing?.paragraph, proc_intro: d.process?.intro,
    seo_t: d.seo?.metaTitle, seo_d: d.seo?.metaDescription,
  }
  ;(d.services || []).forEach((s, i) => (flat[`svc${i}`] = s.paragraph))
  ;(d.process?.steps || []).forEach((s, i) => (flat[`step${i}`] = s.paragraph))
  const tr = await translateMap(flat)
  return {
    titleEs: tr.title, titlePageEs: tr.titlePage, descriptionPageEs: tr.descriptionPage,
    headingEs: tr.heading, paragraph1Es: tr.p1, paragraph2Es: tr.p2,
    galleryParagraphEs: tr.galleryP, reviewsParagraphEs: tr.reviewsP,
    servicesEs: (d.services || []).map((s, i) => ({paragraph: tr[`svc${i}`], imageAlt: s.imageAlt})),
    financingEs: {paragraph: tr.fin_p, imageAlt: d.financing?.imageAlt},
    processEs: {intro: tr.proc_intro, steps: (d.process?.steps || []).map((s, i) => ({paragraph: tr[`step${i}`], imageAlt: s.imageAlt}))},
    seoEs: {metaTitle: tr.seo_t, metaDescription: tr.seo_d},
  }
})

await run('blogPost', async (d) => {
  const flat = {
    title: d.title, summary: d.summary,
    seo_t: d.seo?.metaTitle, seo_d: d.seo?.metaDescription,
    ...ptToMap(d.body, 'body'),
  }
  const tr = await translateMap(flat)
  return {
    titleEs: tr.title, summaryEs: tr.summary,
    bodyEs: ptApply(d.body, 'body', tr),
    seoEs: {metaTitle: tr.seo_t, metaDescription: tr.seo_d},
  }
})

console.log('\nDone.')
