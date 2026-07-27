/**
 * Patch Spanish fields onto the 32 `serviceArea` docs that were migrated from Webflow without any.
 * Reads ./area-es.json.
 *
 * NEVER createOrReplace here, unlike the other seeders: these docs carry Webflow-derived ids
 * (`serviceArea-<legacyId>`, e.g. serviceArea-68f2ed44456c17720f1cbfaa for coral-gables), so
 * createOrReplace with `serviceArea-<slug>` would create a SECOND doc with the same slug and
 * duplicate the route. Resolve the real _id by slug and .set() only the *Es keys.
 *
 * Only fields something actually renders. financingEs / processEs.steps / servicesEs[].imageAlt
 * are deliberately absent — FinancingTeaser.astro and ProcessSteps.astro hard-code that copy and
 * only accept `intro`, so translating them would be dead weight in the CMS.
 *
 * Token: SANITY_WRITE_TOKEN from env, else from the CMS sanity.env (same source as the other seeders).
 *
 *   node scripts/seed-area-es.mjs --dry                      # validate + resolve ids, write nothing
 *   node scripts/seed-area-es.mjs --only coral-gables,miami  # subset
 *   node scripts/seed-area-es.mjs                            # write + self-check
 *
 * --patch-existing rewrites docs that ALREADY have Spanish (Palm Beach), for register/glossary
 * fixes. Two things change in that mode, both mandatory:
 *   1. the anti-clobber `hasEs` guard inverts — a doc WITHOUT titleEs is now the error;
 *   2. the patch switches to dotted paths. Palm Beach docs carry servicesEs[].imageAlt and
 *      processEs.steps that seed-palm-beach.mjs wrote and nothing here re-supplies, so the
 *      default whole-object .set() would silently delete them.
 *
 *   node scripts/seed-area-es.mjs --file pb-cities.json --patch-existing --dry
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'

const HERE = dirname(fileURLToPath(import.meta.url))
const DRY = process.argv.includes('--dry')
const PATCH_EXISTING = process.argv.includes('--patch-existing')
const fileIdx = process.argv.indexOf('--file')
const FILE = fileIdx >= 0 ? process.argv[fileIdx + 1] : 'area-es.json'
const onlyIdx = process.argv.indexOf('--only')
const ONLY = onlyIdx >= 0 ? new Set((process.argv[onlyIdx + 1] || '').split(',').map((s) => s.trim())) : null

// --- token: env first, then the CMS sanity.env fallback (copied from seed-palm-beach.mjs) ---
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

let cities = JSON.parse(readFileSync(join(HERE, FILE), 'utf8'))
if (ONLY) cities = cities.filter((c) => ONLY.has(c.slug))
if (!cities.length) {
  console.error(`Nothing to seed (empty ${FILE} or --only matched nothing).`)
  process.exit(1)
}
const slugs = cities.map((c) => c.slug)

// --- 1. validate before touching the network ---
// The site's own Spanish is 100% "tú" (src/i18n/es.ts: 35 tú, 0 usted) and ProcessSteps/
// FinancingTeaser print "tu" on this very page, so usted-register copy is a defect, not a style.
const ENGLISH = /\b(the|your|and|with|we|our|from|that|for|installation|contractors|builders|screen|louvered)\b/i
// Register is carried by VERB form, not by the possessive. "Las familias de Greenacres … su patio"
// is third-person agreement and perfectly fine in tú-register copy, so matching a bare "su hogar"
// flagged six correct sentences and would have forced them into worse Spanish. Match usted-
// conjugated verbs and the pronoun instead; genuine usted copy always carries one.
const USTED =
  /\b(usted|ustedes|Explore|Descubra|Lea|Vea|Disfrute|Amplíe|Convierta|Elija|Pregúntenos|Recorra|Mantenga|Tome|Agregue|Controle|Recupere|Transforme|Solicite|Programe|Conozca|Comience|Cotice|Pida|Eche|Reciba|Obtenga|Confíe|Escuche|Mire|Cuente con|acompañándolo|guiándolo|para que vea|para que pueda|le damos|le brindan|le permite)\b/
const OFF_GLOSSARY = [
  /l[áa]minas/i,
  /louvers/i,
  /mosquitero/i,
  /solari[ou]m/i,
  /cuartos?\b/i,
  /salas? con /i,
  /patios? cerrados?/i,
  /screen rooms?/i,
  /screen enclosures?/i,
]
// Only Miami-Dade and Broward are High-Velocity Hurricane Zones. Palm Beach sits in the
// wind-borne debris region (~140–170 mph depending on distance inland) — the same split
// PERMIT_BY_COUNTY already encodes in ServiceAreaPage.astro. Copy that claims "HVHZ 175 mph"
// for a Palm Beach city is factually wrong, so it fails validation instead of shipping.
const HVHZ = /\b(HVHZ|175 mph|Zona de Huracanes de Alta Velocidad)\b/i
const problems = []
for (const c of cities) {
  const need = (v, f) => {
    if (typeof v !== 'string' || !v.trim()) problems.push(`${c.slug}: ${f} empty`)
  }
  const clean = (v, f) => {
    if (typeof v !== 'string') return
    if (ENGLISH.test(v)) problems.push(`${c.slug}: ${f} leaks English — "${v.match(ENGLISH)[0]}"`)
    if (USTED.test(v)) problems.push(`${c.slug}: ${f} uses "usted" register — "${v.match(USTED)[0]}"`)
    for (const rx of OFF_GLOSSARY) {
      if (rx.test(v)) problems.push(`${c.slug}: ${f} off-glossary — "${v.match(rx)[0]}"`)
    }
    if (c.county === 'Palm Beach' && HVHZ.test(v)) {
      problems.push(`${c.slug}: ${f} claims HVHZ for a non-HVHZ county — "${v.match(HVHZ)[0]}"`)
    }
  }
  const plain = {
    titlePageEs: c.titlePageEs,
    descriptionPageEs: c.descriptionPageEs,
    headingEs: c.headingEs,
    paragraph1Es: c.paragraph1Es,
    paragraph2Es: c.paragraph2Es,
    galleryParagraphEs: c.galleryParagraphEs,
    reviewsParagraphEs: c.reviewsParagraphEs,
    'processEs.intro': c.processEs?.intro,
    'seoEs.metaTitle': c.seoEs?.metaTitle,
    'seoEs.metaDescription': c.seoEs?.metaDescription,
  }
  need(c.slug, 'slug')
  need(c.titleEs, 'titleEs')
  for (const [f, v] of Object.entries(plain)) {
    need(v, f)
    clean(v, f)
  }
  // City names are proper nouns — titleEs must be the English title verbatim, or the H1, the
  // Service JSON-LD areaServed.name and the nearby-city chips stop naming a real place.
  if (c.titleEs !== c.title) problems.push(`${c.slug}: titleEs must equal title verbatim (got "${c.titleEs}" vs "${c.title}")`)
  if ((c.servicesEs || []).length !== 4) problems.push(`${c.slug}: servicesEs must have exactly 4 blocks, got ${(c.servicesEs || []).length}`)
  ;(c.servicesEs || []).forEach((s, i) => {
    need(s?.paragraph, `servicesEs[${i}].paragraph`)
    clean(s?.paragraph, `servicesEs[${i}].paragraph`)
  })
  // Same limits seed-palm-beach.mjs enforces. Both keys are mandatory: ServiceAreaPage.astro does
  // `(lang === 'es' && area?.seoEs) || area?.seo`, so a half-filled seoEs kills the EN fallback.
  if (c.seoEs?.metaTitle?.length > 70) problems.push(`${c.slug}: seoEs.metaTitle ${c.seoEs.metaTitle.length} > 70`)
  if (c.seoEs?.metaDescription?.length > 160) problems.push(`${c.slug}: seoEs.metaDescription ${c.seoEs.metaDescription.length} > 160`)
}
if (problems.length) {
  console.error(`Validation FAILED (${problems.length}):\n` + problems.map((p) => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log(`Validated ${cities.length} cities, 0 problems.`)

// --- 2. resolve real _ids by slug; abort on draft, duplicate, missing, or already-translated ---
const rows = await client.fetch(
  `*[_type=="serviceArea" && slug.current in $slugs]{ "slug": slug.current, _id, "hasEs": defined(titleEs) }`,
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
// Guard against ever clobbering the 15 hand-written Palm Beach translations.
// --patch-existing is the deliberate opt-out — it inverts the check, so pointing that mode at an
// untranslated doc (which would leave titleEs undefined and break the ES page) still aborts.
if (PATCH_EXISTING) {
  const untranslated = slugs.filter((s) => !bySlug[s].hasEs)
  if (untranslated.length) {
    console.error(`--patch-existing needs docs that already have Spanish; these do not: ${untranslated.join(', ')}`)
    process.exit(1)
  }
} else {
  const already = slugs.filter((s) => bySlug[s].hasEs)
  if (already.length) {
    console.error(`Refusing to overwrite existing Spanish content: ${already.join(', ')}`)
    console.error('Use --patch-existing if rewriting them is the point.')
    process.exit(1)
  }
}

// --- 3. patch: only *Es keys, so EN copy and legacyId survive untouched ---
// Deterministic _keys, same scheme as seed-palm-beach.mjs:46.
const esPatch = (c) => ({
  titleEs: c.titleEs,
  titlePageEs: c.titlePageEs,
  descriptionPageEs: c.descriptionPageEs,
  headingEs: c.headingEs,
  paragraph1Es: c.paragraph1Es,
  paragraph2Es: c.paragraph2Es,
  servicesEs: c.servicesEs.map((s, i) => ({
    _key: `${c.slug}-svce-${i}`,
    _type: 'serviceBlockEs',
    paragraph: s.paragraph,
  })),
  galleryParagraphEs: c.galleryParagraphEs,
  reviewsParagraphEs: c.reviewsParagraphEs,
  processEs: { intro: c.processEs.intro },
  seoEs: { _type: 'seo', metaTitle: c.seoEs.metaTitle, metaDescription: c.seoEs.metaDescription },
})

// --patch-existing variant: dotted paths, so sibling keys the JSON does not carry survive.
// servicesEs is addressed by _key rather than index — index paths would reorder-corrupt silently
// if the array ever differs, and the _key scheme is seed-palm-beach.mjs:46's, already asserted below.
const esPatchSurgical = (c) => ({
  titlePageEs: c.titlePageEs,
  descriptionPageEs: c.descriptionPageEs,
  headingEs: c.headingEs,
  paragraph1Es: c.paragraph1Es,
  paragraph2Es: c.paragraph2Es,
  galleryParagraphEs: c.galleryParagraphEs,
  reviewsParagraphEs: c.reviewsParagraphEs,
  'processEs.intro': c.processEs.intro,
  'seoEs.metaTitle': c.seoEs.metaTitle,
  'seoEs.metaDescription': c.seoEs.metaDescription,
  ...Object.fromEntries(
    c.servicesEs.map((s, i) => [`servicesEs[_key=="${c.slug}-svce-${i}"].paragraph`, s.paragraph]),
  ),
})
const patchFor = (c) => (PATCH_EXISTING ? esPatchSurgical(c) : esPatch(c))

// In surgical mode a _key that does not exist is a silent no-op, not an error — assert the
// live keys match before writing, or four paragraphs quietly fail to update.
if (PATCH_EXISTING) {
  const live = await client.fetch(`*[_type=="serviceArea" && slug.current in $slugs]{ "slug": slug.current, "keys": servicesEs[]._key }`, { slugs })
  const keyProblems = []
  for (const c of cities) {
    const got = live.find((r) => r.slug === c.slug)?.keys || []
    const want = c.servicesEs.map((_, i) => `${c.slug}-svce-${i}`)
    for (const k of want) if (!got.includes(k)) keyProblems.push(`${c.slug}: no servicesEs entry with _key "${k}" (live: ${got.join(', ') || 'none'})`)
  }
  if (keyProblems.length) {
    console.error(`servicesEs _key mismatch (${keyProblems.length}):\n` + keyProblems.map((p) => '  - ' + p).join('\n'))
    process.exit(1)
  }
  console.log(`servicesEs _keys verified on ${cities.length} docs.`)
}

if (DRY) {
  for (const c of cities) {
    console.log(`  ~ would patch ${bySlug[c.slug]._id} (${c.slug}) — ${Object.keys(patchFor(c)).length} Es keys`)
  }
  console.log('--dry: nothing written.')
  process.exit(0)
}
for (const c of cities) {
  await client.patch(bySlug[c.slug]._id).set(patchFor(c)).commit()
  console.log(`  ✓ ${bySlug[c.slug]._id} (${c.slug})`)
}

// --- 4. self-check: refetch field by field, published perspective, no CDN ---
const back = await client.fetch(
  `*[_type=="serviceArea" && slug.current in $slugs]{
     "slug": slug.current, titleEs, titlePageEs, descriptionPageEs, headingEs,
     paragraph1Es, paragraph2Es, galleryParagraphEs, reviewsParagraphEs,
     "nSvcEs": count(servicesEs), "procIntroEs": processEs.intro,
     "mtEs": seoEs.metaTitle, "mdEs": seoEs.metaDescription,
     "svcAlts": count(servicesEs[defined(imageAlt)]), "nStepsEs": count(processEs.steps) }`,
  { slugs },
)
const bad = []
if (back.length !== slugs.length) bad.push(`refetched ${back.length}, expected ${slugs.length}`)
for (const d of back) {
  for (const k of [
    'titleEs', 'titlePageEs', 'descriptionPageEs', 'headingEs', 'paragraph1Es',
    'paragraph2Es', 'galleryParagraphEs', 'reviewsParagraphEs', 'procIntroEs', 'mtEs', 'mdEs',
  ]) {
    if (typeof d[k] !== 'string' || !d[k].trim()) bad.push(`${d.slug}: ${k} empty after write`)
  }
  if (d.nSvcEs !== 4) bad.push(`${d.slug}: servicesEs = ${d.nSvcEs}, expected 4`)
  // The failure mode surgical mode exists to prevent: a whole-object .set() wiping the sibling
  // keys this script never re-supplies. Assert they are still there rather than assume.
  if (PATCH_EXISTING) {
    if (d.svcAlts !== 4) bad.push(`${d.slug}: servicesEs[].imageAlt survived on ${d.svcAlts}/4 — patch clobbered siblings`)
    if (d.nStepsEs !== 3) bad.push(`${d.slug}: processEs.steps = ${d.nStepsEs}, expected 3 — patch clobbered steps`)
  }
}
if (bad.length) {
  console.error(`Self-check FAILED (${bad.length}):\n` + bad.map((b) => '  - ' + b).join('\n'))
  process.exit(1)
}
console.log(`Self-check OK: ${back.length}/${slugs.length} cities now have Spanish.`)
console.log('Note: a Sanity write does not trigger a Vercel deploy — rebuild to see it.')
