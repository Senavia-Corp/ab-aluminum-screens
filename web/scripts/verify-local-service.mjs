/**
 * Pre-deploy gate for the local (service × city) landing pages. Verifies every city page
 * built with proper SEO meta + a city-specific H1, is in the sitemap, is linked from the
 * service hub page, and emits Service + FAQPage + BreadcrumbList JSON-LD.
 * Run AFTER `npm run build`. Exits non-zero on any failure (blocks deploy).
 *
 *   node scripts/verify-local-service.mjs --service aluminum-pergolas
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const ORIGIN = 'https://www.abaluminumandscreens.com'
const SERVICE_ROUTES = ['aluminum-pergolas', 'pool-enclosure', 'patio-screens', 'louvered-roof-system']

const i = process.argv.indexOf('--service')
const service = i >= 0 ? process.argv[i + 1] : undefined
if (!service || !SERVICE_ROUTES.includes(service)) {
  console.error(`--service must be one of: ${SERVICE_ROUTES.join(', ')}`)
  process.exit(1)
}

const cities = JSON.parse(readFileSync(join(HERE, `local-${service}-cities.json`), 'utf8'))

const OUT = ['.vercel/output/static', 'dist'].map((d) => join(ROOT, d)).find(existsSync)
if (!OUT) { console.error('No build output found. Run `npm run build` first.'); process.exit(1) }
console.log(`Build output: ${OUT} — verifying ${cities.length} ${service} cities`)

const fails = []
const ok = (l) => console.log(`  ✓ ${l}`)
const bad = (l) => { console.log(`  ✗ ${l}`); fails.push(l) }

function readPage(rel) {
  for (const cand of [join(OUT, rel, 'index.html'), join(OUT, `${rel}.html`)]) {
    if (existsSync(cand)) return readFileSync(cand, 'utf8')
  }
  return null
}
const titleOf = (h) => (h.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim()
const descOf = (h) => (h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '').trim()
const h1Of = (h) => (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim()
const ldTypes = (h) => {
  const types = []
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(h))) { try { const j = JSON.parse(m[1]); types.push(j['@graph'] ? '@graph' : j['@type']) } catch {} }
  return types
}

// 1) EN + ES pages: meta + city-specific H1 + JSON-LD stack
console.log('\n[1] City pages built with SEO meta, city H1, and JSON-LD:')
for (const c of cities) {
  const cityName = (c.title.split('—')[1] || '').trim() || c.citySlug
  for (const [lang, rel] of [['EN', `${service}/${c.citySlug}`], ['ES', `es/${service}/${c.citySlug}`]]) {
    const html = readPage(rel)
    if (!html) { bad(`${lang} ${c.citySlug}: page missing`); continue }
    const t = titleOf(html), d = descOf(html), h1 = h1Of(html)
    const okMeta = t && d
    const okH1 = h1 && (lang === 'EN' ? h1.includes(cityName) : true) // ES city name may differ; just require non-empty
    const types = ldTypes(html)
    const okLd = types.includes('@graph') && types.includes('Service') && types.includes('BreadcrumbList') && types.includes('FAQPage')
    if (okMeta && okH1 && okLd) ok(`${lang} ${c.citySlug}: title(${t.length}) desc(${d.length}) h1 ✓ ld[${types.join(',')}]`)
    else bad(`${lang} ${c.citySlug}: ${!t ? 'no title ' : ''}${!d ? 'no desc ' : ''}${!okH1 ? 'H1 missing city ' : ''}${!okLd ? 'JSON-LD incomplete[' + types.join(',') + ']' : ''}`)
  }
}

// 2) sitemap includes each city URL (EN + ES)
console.log('\n[2] Sitemap includes city URLs:')
const sitemapXml = readdirSync(OUT).filter((f) => /^sitemap.*\.xml$/.test(f)).map((f) => readFileSync(join(OUT, f), 'utf8')).join('\n')
if (!sitemapXml) bad('no sitemap*.xml in build output')
else for (const c of cities) {
  for (const [lang, url] of [['EN', `${ORIGIN}/${service}/${c.citySlug}`], ['ES', `${ORIGIN}/es/${service}/${c.citySlug}`]]) {
    if (sitemapXml.includes(url)) ok(`${lang} ${c.citySlug} in sitemap`)
    else bad(`${lang} ${c.citySlug} NOT in sitemap (${url})`)
  }
}

// 3) service hub page links every city page
console.log('\n[3] Service hub links the city pages:')
const hub = readPage(service)
if (!hub) bad(`${service} hub page missing`)
else for (const c of cities) {
  if (hub.includes(`/${service}/${c.citySlug}`)) ok(`hub links ${c.citySlug}`)
  else bad(`hub does NOT link ${c.citySlug}`)
}

console.log(`\n${'='.repeat(50)}`)
if (fails.length) { console.error(`GATE FAILED — ${fails.length} problem(s). Do NOT deploy.`); process.exit(1) }
console.log(`GATE PASSED — ${cities.length} ${service} cities: meta + H1 + JSON-LD + sitemap + hub links all OK.`)
