/**
 * Fix EN copy errata inherited from the Webflow migration, found by sweeping all 47 `serviceArea`
 * and 188 `localService` docs against the shared template of the 32 migrated docs.
 *
 * NEVER createOrReplace here, same reason as seed-area-es.mjs: the migrated docs carry
 * Webflow-derived ids (`serviceArea-<legacyId>`, e.g. serviceArea-68f2ed44456c17720f1cbfaa for
 * coral-gables), so createOrReplace with `serviceArea-<slug>` would create a SECOND doc with the
 * same slug and duplicate the route. Resolve the real _id by slug and .set() only the fields below.
 *
 * Fixes are declared as ASCII search/replace pairs verified against the LIVE value rather than as
 * whole replacement strings: this copy contains curly apostrophes (’) and em-dashes (—) that are
 * trivial to corrupt by retyping. If a `find` is absent — because the CMS drifted or someone
 * already fixed it in Studio — the script aborts instead of writing something wrong.
 *
 * Array items are addressed by `_key` (JSONMatch), never by index, so a reordered array can't
 * send a patch to the wrong element.
 *
 * Token: SANITY_WRITE_TOKEN from env, else from the CMS sanity.env (same source as the seeders).
 *
 *   node scripts/fix-en-typos.mjs --dry   # validate + resolve ids, write nothing
 *   node scripts/fix-en-typos.mjs         # write + self-check
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@sanity/client'

const DRY = process.argv.includes('--dry')

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
  // Without this the API defaults to `raw`, which includes drafts.* — a doc someone has open in
  // Studio would win the id lookup and we'd patch an invisible draft instead of the live page.
  perspective: 'published',
})

// --- the fix table -----------------------------------------------------------------------------
// `at`: 'field' | {arr, index, key} — index is used ONLY to locate the item and read its _key.
// `find`/`replace`: plain ASCII substrings; every `find` must be present in the live value.
const FIXES = [
  // The reported bug: leading "E" lost from "Explore". 31/32 migrated siblings have it.
  { slug: 'coral-gables', at: 'galleryParagraph',
    find: 'xplore our gallery of aluminum', replace: 'Explore our gallery of aluminum' },

  // miami: comma downgraded to a period, leaving "As trusted pergola contractors in Miami,
  // Florida." as a sentence fragment. All 31 siblings read "in CITY, Florida, we specialize".
  { slug: 'miami', at: 'paragraph1',
    find: 'Florida. We specialize', replace: 'Florida, we specialize' },

  // miami: "Miami Florida" missing its comma in three places (siblings: "CITY, Florida,").
  { slug: 'miami', at: 'paragraph2',
    find: 'in Miami Florida.', replace: 'in Miami, Florida.' },
  { slug: 'miami', at: 'financing.paragraph',
    find: 'in Miami Florida and enjoy', replace: 'in Miami, Florida, and enjoy' },
  { slug: 'miami', at: { arr: 'services', index: 0, key: 'imageAlt' },
    find: 'in Miami Florida.', replace: 'in Miami, Florida.' },

  // miami: "pool screens enclosure(s)" — wrong plural, and the only doc of 235 with this string.
  { slug: 'miami', at: 'reviewsParagraph',
    find: 'pool screens enclosures', replace: 'pool screen enclosures' },
  { slug: 'miami', at: { arr: 'services', index: 1, key: 'paragraph' },
    find: 'pool screens enclosure', replace: 'pool screen enclosure' },
  { slug: 'miami', at: { arr: 'process.steps', index: 0, key: 'paragraph' },
    find: 'pool screens enclosure', replace: 'pool screen enclosure' },
  { slug: 'miami', at: { arr: 'process.steps', index: 2, key: 'paragraph' },
    find: 'pool screens enclosures', replace: 'pool screen enclosures' },
]

// doral process.steps[1] is a verbatim duplicate of steps[0]; the "custom 3D design" step was lost
// in migration (31/32 siblings have it). Rebuilt from a sibling at runtime rather than retyped, so
// the em-dash and curly apostrophe come from the CMS itself.
const DORAL_STEP = { slug: 'doral', arr: 'process.steps', index: 1, key: 'paragraph',
                     from: { slug: 'miami', index: 1 }, city: 'Doral', refCity: 'Miami' }

const slugs = [...new Set([...FIXES.map((f) => f.slug), DORAL_STEP.slug, DORAL_STEP.from.slug])]

// --- 1. resolve real _ids by slug; abort on draft, duplicate, or missing -----------------------
const rows = await client.fetch(
  `*[_type=="serviceArea" && slug.current in $slugs]{ "slug": slug.current, _id, process, services,
     galleryParagraph, paragraph1, paragraph2, reviewsParagraph, financing }`,
  { slugs },
)
const drafts = rows.filter((r) => r._id.startsWith('drafts.'))
if (drafts.length) {
  console.error(`Draft docs present — close Studio and retry: ${drafts.map((d) => d._id).join(', ')}`)
  process.exit(1)
}
const bySlug = {}
for (const r of rows) {
  if (bySlug[r.slug]) {
    console.error(`Two serviceArea docs share slug "${r.slug}": ${bySlug[r.slug]._id} and ${r._id}`)
    process.exit(1)
  }
  bySlug[r.slug] = r
}
const missing = slugs.filter((s) => !bySlug[s])
if (missing.length) {
  console.error(`No serviceArea doc for: ${missing.join(', ')}`)
  process.exit(1)
}

const dig = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)

// --- 2. build patches, verifying every `find` against the live value ---------------------------
const problems = []
const patches = {}   // slug -> { jsonMatchPath: newValue }
const preview = []

for (const fx of FIXES) {
  const doc = bySlug[fx.slug]
  let path, current
  if (typeof fx.at === 'string') {
    path = fx.at
    current = dig(doc, fx.at)
  } else {
    const arr = dig(doc, fx.at.arr)
    const item = arr?.[fx.at.index]
    if (!item?._key) {
      problems.push(`${fx.slug}: ${fx.at.arr}[${fx.at.index}] missing or has no _key`)
      continue
    }
    path = `${fx.at.arr}[_key=="${item._key}"].${fx.at.key}`
    current = item[fx.at.key]
  }
  if (typeof current !== 'string') {
    problems.push(`${fx.slug}: ${path} is not a string (got ${typeof current})`)
    continue
  }
  if (!current.includes(fx.find)) {
    problems.push(`${fx.slug}: ${path} does not contain ${JSON.stringify(fx.find)} — already fixed or drifted`)
    continue
  }
  const next = current.split(fx.find).join(fx.replace)
  if (next === current) {
    problems.push(`${fx.slug}: ${path} unchanged after replace`)
    continue
  }
  ;(patches[fx.slug] ||= {})[path] = next
  preview.push({ slug: fx.slug, path, before: current, after: next })
}

// doral: rebuild the lost step from the sibling template.
{
  const d = bySlug[DORAL_STEP.slug]
  const ref = bySlug[DORAL_STEP.from.slug]
  const steps = dig(d, DORAL_STEP.arr)
  const item = steps?.[DORAL_STEP.index]
  const refText = dig(ref, DORAL_STEP.arr)?.[DORAL_STEP.from.index]?.[DORAL_STEP.key]
  const dupOf = steps?.[0]?.[DORAL_STEP.key]
  if (!item?._key) {
    problems.push(`doral: ${DORAL_STEP.arr}[${DORAL_STEP.index}] missing or has no _key`)
  } else if (typeof refText !== 'string' || !refText.includes('3D design')) {
    problems.push(`doral: sibling template (${DORAL_STEP.from.slug}) is not the 3D-design step`)
  } else if (item[DORAL_STEP.key] !== dupOf) {
    problems.push(`doral: steps[1] is no longer a duplicate of steps[0] — already fixed or drifted`)
  } else {
    const next = refText.split(DORAL_STEP.refCity).join(DORAL_STEP.city)
    if (next.includes(DORAL_STEP.refCity) || !next.includes(DORAL_STEP.city)) {
      problems.push(`doral: city substitution produced a bad string`)
    } else {
      const path = `${DORAL_STEP.arr}[_key=="${item._key}"].${DORAL_STEP.key}`
      ;(patches['doral'] ||= {})[path] = next
      preview.push({ slug: 'doral', path, before: item[DORAL_STEP.key], after: next })
    }
  }
}

if (problems.length) {
  console.error(`Validation FAILED (${problems.length}):\n` + problems.map((p) => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log(`Validated ${preview.length} field fixes across ${Object.keys(patches).length} docs, 0 problems.\n`)
for (const p of preview) {
  console.log(`  ${bySlug[p.slug]._id}`)
  console.log(`    ${p.path}`)
  console.log(`      - ${p.before.slice(0, 150)}`)
  console.log(`      + ${p.after.slice(0, 150)}\n`)
}

if (DRY) {
  console.log('--dry: nothing written.')
  process.exit(0)
}

// --- 3. patch ----------------------------------------------------------------------------------
for (const [slug, set] of Object.entries(patches)) {
  await client.patch(bySlug[slug]._id).set(set).commit()
  console.log(`  ✓ ${bySlug[slug]._id} (${slug}) — ${Object.keys(set).length} field(s)`)
}

// --- 4. self-check: refetch, published perspective, no CDN -------------------------------------
const back = await client.fetch(
  `*[_type=="serviceArea" && slug.current in $slugs]{ "slug": slug.current, process, services,
     galleryParagraph, paragraph1, paragraph2, reviewsParagraph, financing }`,
  { slugs },
)
const backBySlug = Object.fromEntries(back.map((d) => [d.slug, d]))
const bad = []
for (const p of preview) {
  const doc = backBySlug[p.slug]
  const m = p.path.match(/^(.+)\[_key=="(.+)"\]\.(.+)$/)
  const got = m ? dig(doc, m[1])?.find((x) => x._key === m[2])?.[m[3]] : dig(doc, p.path)
  if (got !== p.after) bad.push(`${p.slug}: ${p.path} did not take (got ${JSON.stringify(String(got).slice(0, 80))})`)
}
// The defects must be gone corpus-wide, not just in the docs we touched.
const all = await client.fetch(`*[_type=="serviceArea"]{ "slug": slug.current, process, services,
  galleryParagraph, paragraph1, paragraph2, reviewsParagraph, financing }`)
for (const d of all) {
  const blob = JSON.stringify(d)
  if (blob.includes('pool screens enclosure')) bad.push(`${d.slug}: still contains "pool screens enclosure"`)
  if (blob.includes('Miami Florida')) bad.push(`${d.slug}: still contains "Miami Florida"`)
  if (typeof d.galleryParagraph === 'string' && /^[a-z]/.test(d.galleryParagraph)) {
    bad.push(`${d.slug}: galleryParagraph still starts lowercase`)
  }
  const steps = (d.process?.steps || []).map((s) => s.paragraph)
  if (steps.length && new Set(steps).size !== steps.length) bad.push(`${d.slug}: process.steps still has duplicate paragraphs`)
}
if (bad.length) {
  console.error(`\nSelf-check FAILED (${bad.length}):\n` + bad.map((b) => '  - ' + b).join('\n'))
  process.exit(1)
}
console.log(`\nSelf-check OK: ${preview.length} fields corrected, 0 defects remain corpus-wide.`)
console.log('Note: a Sanity write does not trigger a Vercel deploy — rebuild to see it.')
