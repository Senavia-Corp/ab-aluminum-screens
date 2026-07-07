/**
 * Pre-deploy gate: verify every Palm Beach city page built with proper SEO meta,
 * appears in the sitemap, and is linked from the Service Areas index.
 * Run AFTER `npm run build`. Exits non-zero on any failure (blocks deploy).
 *
 *   node scripts/verify-palm-beach.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const ORIGIN = 'https://www.abaluminumandscreens.com'
const slugs = JSON.parse(readFileSync(join(HERE, 'pb-cities.json'), 'utf8')).map((c) => c.slug)

// locate build output (vercel adapter -> .vercel/output/static, else dist)
const OUT = ['.vercel/output/static', 'dist'].map((d) => join(ROOT, d)).find(existsSync)
if (!OUT) { console.error('No build output found (.vercel/output/static or dist). Run `npm run build` first.'); process.exit(1) }
console.log(`Build output: ${OUT}`)

const fails = []
const ok = (label) => console.log(`  ✓ ${label}`)
const bad = (label) => { console.log(`  ✗ ${label}`); fails.push(label) }

function readPage(rel) {
  for (const cand of [join(OUT, rel, 'index.html'), join(OUT, `${rel}.html`)]) {
    if (existsSync(cand)) return readFileSync(cand, 'utf8')
  }
  return null
}
function titleOf(html) { const m = html.match(/<title>([\s\S]*?)<\/title>/i); return m ? m[1].trim() : '' }
function descOf(html) { const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i); return m ? m[1].trim() : '' }

// 1) EN + ES pages exist with non-empty <title> + meta description
console.log('\n[1] City pages built with SEO meta (EN + ES):')
for (const slug of slugs) {
  for (const [lang, rel] of [['EN', `service-areas/${slug}`], ['ES', `es/service-areas/${slug}`]]) {
    const html = readPage(rel)
    if (!html) { bad(`${lang} ${slug}: page missing`); continue }
    const t = titleOf(html), d = descOf(html)
    if (t && d) ok(`${lang} ${slug}: title="${t.slice(0, 40)}…" desc(${d.length})`)
    else bad(`${lang} ${slug}: ${!t ? 'empty <title> ' : ''}${!d ? 'empty meta description' : ''}`)
  }
}

// 2) sitemap includes each city URL (EN + ES)
console.log('\n[2] Sitemap includes city URLs:')
const sitemapXml = readdirSync(OUT)
  .filter((f) => /^sitemap.*\.xml$/.test(f))
  .map((f) => readFileSync(join(OUT, f), 'utf8'))
  .join('\n')
if (!sitemapXml) bad('no sitemap*.xml in build output')
else {
  for (const slug of slugs) {
    for (const [lang, url] of [['EN', `${ORIGIN}/service-areas/${slug}`], ['ES', `${ORIGIN}/es/service-areas/${slug}`]]) {
      if (sitemapXml.includes(url)) ok(`${lang} ${slug} in sitemap`)
      else bad(`${lang} ${slug} NOT in sitemap (${url})`)
    }
  }
}

// 3) Service Areas index links every city under a Palm Beach group
console.log('\n[3] Service Areas index links the cities:')
const idx = readPage('service-areas')
if (!idx) bad('service-areas index page missing')
else {
  if (/palm\s*beach/i.test(idx)) ok('index shows a "Palm Beach" group')
  else bad('index missing "Palm Beach" group heading')
  for (const slug of slugs) {
    if (idx.includes(`/service-areas/${slug}`)) ok(`index links ${slug}`)
    else bad(`index does NOT link ${slug}`)
  }
}

console.log(`\n${'='.repeat(50)}`)
if (fails.length) { console.error(`GATE FAILED — ${fails.length} problem(s). Do NOT deploy.`); process.exit(1) }
console.log(`GATE PASSED — ${slugs.length} cities: pages + meta + sitemap + index links all OK.`)
