/**
 * One-shot migration: Webflow CSV export (already downloaded to local) -> Sanity.
 * - Uploads every local image as a Sanity asset (dedup by path).
 * - Converts Webflow rich-text HTML to Portable Text.
 * - Creates PUBLISHED docs with deterministic _id from the Webflow Item ID,
 *   so re-running updates instead of duplicating.
 *
 * Run:  node import.mjs            (full import)
 *       node import.mjs --dry      (no writes, just report)
 */
import {readFileSync, createReadStream, existsSync, mkdirSync} from 'node:fs'
import {basename, join} from 'node:path'
import {randomUUID} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {createClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {htmlToBlocks} from '@portabletext/block-tools'
import {JSDOM} from 'jsdom'

const CMS_DIR = '/Users/senavia/Sites/ab-aluminum/source/CMS Webflow AB Aluminum And Screens'
const R2_VIDEO_BASE = 'https://pub-fafa1a5fa104499f81089136f87db62b.r2.dev/services/'
const DRY = process.argv.includes('--dry')

// --- env (token) -----------------------------------------------------------
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
  apiVersion: env.SANITY_API_VERSION || '2026-06-23',
  token: env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// concurrency gate — Sanity caps in-flight requests at 25; stay well under.
function makeLimiter(max) {
  let active = 0
  const q = []
  const next = () => {
    if (active < max && q.length) {
      active++
      const {fn, res, rej} = q.shift()
      fn().then(res, rej).finally(() => {
        active--
        next()
      })
    }
  }
  return (fn) => new Promise((res, rej) => (q.push({fn, res, rej}), next()))
}
const limit = makeLimiter(8)

// --- helpers ---------------------------------------------------------------
const blockSchema = Schema.compile({
  types: [{name: 'blockContent', type: 'array', of: [{type: 'block'}]}],
})
const blockContentType = blockSchema.get('blockContent')

function htmlToPT(html) {
  if (!html || !html.trim()) return undefined
  const blocks = htmlToBlocks(html, blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
  })
  return blocks.length ? blocks : undefined
}

const assetCache = new Map()
let uploadCount = 0
async function asset(absPath) {
  if (!existsSync(absPath)) {
    console.warn('  ⚠ missing image:', absPath)
    return null
  }
  if (assetCache.has(absPath)) return assetCache.get(absPath)
  if (DRY) {
    assetCache.set(absPath, 'dry-asset')
    return 'dry-asset'
  }
  const id = await limit(async () => {
    // Sanity can't process AVIF on upload — convert to JPEG (keeps local original).
    let uploadPath = absPath
    let filename = basename(absPath)
    if (absPath.toLowerCase().endsWith('.avif')) {
      mkdirSync('/tmp/ab-import', {recursive: true})
      filename = filename.replace(/\.avif$/i, '.jpg')
      uploadPath = join('/tmp/ab-import', filename)
      execFileSync('sips', ['-s', 'format', 'jpeg', absPath, '--out', uploadPath], {stdio: 'ignore'})
    }
    const doc = await client.assets.upload('image', createReadStream(uploadPath), {filename})
    uploadCount++
    if (uploadCount % 25 === 0) console.log(`  …${uploadCount} assets uploaded`)
    return doc._id
  })
  assetCache.set(absPath, id)
  return id
}

// pageImage object (optionally for an array member -> needs _key)
async function img(absPath, alt, {key = false, extra = {}} = {}) {
  const ref = await asset(absPath)
  if (!ref) return undefined
  return {
    _type: 'image',
    ...(key ? {_key: randomUUID()} : {}),
    asset: {_type: 'reference', _ref: ref},
    alt: alt || '',
    ...extra,
  }
}

const readJson = (p) => JSON.parse(readFileSync(join(CMS_DIR, p), 'utf8'))
async function put(doc) {
  if (DRY) return doc._id
  await client.createOrReplace(doc)
  return doc._id
}

// --- 1. blog categories ----------------------------------------------------
async function importCategories(posts) {
  const titleFor = (slug) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const slugs = [...new Set(posts.map((p) => p.category).filter(Boolean))]
  for (const slug of slugs) {
    await put({
      _id: `blogCategory-${slug}`,
      _type: 'blogCategory',
      title: titleFor(slug),
      slug: {_type: 'slug', current: slug},
    })
  }
  console.log(`✓ ${slugs.length} blog categories`)
  return slugs
}

// --- 2. services -----------------------------------------------------------
async function importServices() {
  const base = 'services'
  const items = readJson(`${base}/content.json`)
  for (const s of items) {
    const p = (rel) => join(CMS_DIR, base, rel)
    const doc = {
      _id: `service-${s.item_id}`,
      _type: 'service',
      legacyId: s.item_id,
      title: s.name,
      slug: {_type: 'slug', current: s.slug},
      seo: {_type: 'seo', metaTitle: s.meta_title, metaDescription: s.meta_description},
      hero: {
        heading: s.hero?.heading,
        paragraph: s.hero?.paragraph,
        image: s.hero?.image ? await img(p(s.hero.image), s.hero.image_alt) : undefined,
      },
      intro: {heading: s.intro?.heading, paragraph: s.intro?.paragraph},
      pageImages: (
        await Promise.all((s.pages || []).map((pg) => img(p(pg.image), pg.alt, {key: true})))
      ).filter(Boolean),
      engineered: {
        heading: s.engineered?.heading,
        paragraph: s.engineered?.paragraph,
        videoUrl: s.engineered?.video ? R2_VIDEO_BASE + basename(s.engineered.video) : undefined,
      },
      featured: {
        heading: s.featured?.heading,
        body: htmlToPT(s.featured?.paragraph_html),
        image: s.featured?.image ? await img(p(s.featured.image), s.featured.image_alt) : undefined,
      },
      colors: {
        heading: s.colors?.heading,
        body: htmlToPT(s.colors?.paragraph_html),
        image: s.colors?.image ? await img(p(s.colors.image), s.colors.image_alt) : undefined,
      },
      contactImage: s.contact_form?.image
        ? await img(p(s.contact_form.image), s.contact_form.image_alt)
        : undefined,
      financingImage: s.financing?.image
        ? await img(p(s.financing.image), s.financing.image_alt)
        : undefined,
    }
    await put(doc)
    console.log('  ✓ service:', s.slug)
  }
  console.log(`✓ ${items.length} services`)
}

// --- 3. blog posts ---------------------------------------------------------
async function importBlog() {
  const base = 'blog-posts'
  const items = readJson(`${base}/content.json`)
  for (const b of items) {
    const doc = {
      _id: `blogPost-${b.item_id}`,
      _type: 'blogPost',
      legacyId: b.item_id,
      title: b.name,
      slug: {_type: 'slug', current: b.slug},
      featured: b.featured === true || b.featured === 'true',
      category: b.category ? {_type: 'reference', _ref: `blogCategory-${b.category}`} : undefined,
      author: b.author || undefined,
      summary: b.summary || undefined,
      mainImage: b.main_image ? await img(join(CMS_DIR, base, b.main_image), b.main_image_alt) : undefined,
      body: htmlToPT(b.body_html),
      publishedAt: b.published_on ? new Date(b.published_on).toISOString() : undefined,
      seo: {_type: 'seo', metaTitle: b.title_seo, metaDescription: b.metadescription_seo},
      jsonLd: b.schema_jsonld || undefined,
    }
    await put(doc)
  }
  console.log(`✓ ${items.length} blog posts`)
}

// --- 4. service areas (no images, alt text only) ---------------------------
async function importAreas() {
  const items = readJson('service-areas/content.json')
  const g = (it, k) => (it[k] || '').trim() || undefined
  for (const a of items) {
    const services = [1, 2, 3, 4]
      .map((n) => ({
        _key: randomUUID(),
        _type: 'serviceBlock',
        paragraph: g(a, `Paragraph Service ${n}`),
        imageAlt: g(a, `Metadata Image Service ${n}`),
      }))
      .filter((x) => x.paragraph || x.imageAlt)
    const steps = [1, 2, 3]
      .map((n) => ({
        _key: randomUUID(),
        _type: 'processStep',
        paragraph: g(a, `Paragraph Process ${n}`),
        imageAlt: g(a, `Metadata Image Process ${n}`),
      }))
      .filter((x) => x.paragraph || x.imageAlt)
    const doc = {
      _id: `serviceArea-${a['Item ID']}`,
      _type: 'serviceArea',
      legacyId: a['Item ID'],
      title: a.Name,
      slug: {_type: 'slug', current: a.Slug},
      titlePage: g(a, 'Title Page'),
      descriptionPage: g(a, 'Description Page'),
      pageImageAlts: [1, 2, 3].map((n) => g(a, `Metadata Image Page ${n}`)).filter(Boolean),
      heading: g(a, 'Heading 1'),
      paragraph1: g(a, 'Paragraph 1'),
      paragraph2: g(a, 'Paragraph 2'),
      services,
      galleryParagraph: g(a, 'Paragraph Gallery'),
      reviewsParagraph: g(a, 'Paragraph Reviews'),
      financing: {paragraph: g(a, 'Paragraph Financing'), imageAlt: g(a, 'Metadata Image Financing')},
      process: {intro: g(a, 'Paragraph Process'), steps},
      contactImageAlt: g(a, 'Metadata Image Contact'),
      seo: {_type: 'seo', metaTitle: g(a, 'Meta Title SEO'), metaDescription: g(a, 'Metadescripcion SEO')},
    }
    await put(doc)
  }
  console.log(`✓ ${items.length} service areas`)
}

// --- 5. galleries ----------------------------------------------------------
async function importGalleries() {
  const cols = [
    {slug: 'pergolas', title: 'Pergolas'},
    {slug: 'patio-screens', title: 'Patio Screens'},
    {slug: 'louvered-roofs', title: 'Louvered Roofs'},
    {slug: 'pool-enclosures', title: 'Pool Enclosures'},
  ]
  for (const c of cols) {
    const base = `Gallery CMS/collections/${c.slug}`
    const items = readJson(`${base}/content.json`)
    const images = (
      await Promise.all(
        items.map((it) =>
          img(join(CMS_DIR, base, it.image), it.metadata || `${c.title} project — AB Aluminum & Screens`, {
            key: true,
            extra: {featured: it.feature === true},
          }),
        ),
      )
    ).filter(Boolean)
    await put({
      _id: `gallery-${c.slug}`,
      _type: 'galleryCollection',
      title: c.title,
      slug: {_type: 'slug', current: c.slug},
      images,
    })
    console.log(`  ✓ gallery ${c.slug}: ${images.length} photos`)
  }
  console.log(`✓ ${cols.length} galleries`)
}

// --- run -------------------------------------------------------------------
console.log(DRY ? '— DRY RUN (no writes) —' : `→ importing into ${env.SANITY_PROJECT_ID}/${env.SANITY_DATASET}`)
const posts = readJson('blog-posts/content.json')
await importCategories(posts)
await importServices()
await importBlog()
await importAreas()
await importGalleries()
console.log(`\nDone. Assets uploaded: ${uploadCount}`)
