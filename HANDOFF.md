# AB Aluminum & Screens — Quality Uplift + Launch Hardening — HANDOFF

**Date:** 2026-06-26 · **Scope:** premium quality uplift + launch layer. **No deploy** — owner publishes.
**Build:** `npm run build` exit 0, **193 HTML pages** (identical to pre-change baseline), no new warnings (only the benign Vercel "Node 24→22" notice). Root: `~/Sites/ab-aluminum/web`.

---

## What changed (by area)

### New components (`src/components/`)
- **`FAQ.astro`** — reusable `<details>` accordion + the single `FAQPage` JSON-LD emitter per page. Now used by Contact, Financing, and every Service page (one FAQPage node per page; no double emission).
- **`AnswerBlock.astro`** — GEO/AEO "direct answer" panel (question H2 + 40–55-word answer + real-data fact chips). On Home, Service ×4, ServiceArea, AreasIndex, OurWork, Financing.
- **`MapEmbed.astro`** — click-to-load Google Maps **facade**. No third-party request/cookie until the user clicks. Replaced the raw `<iframe>` on Contact + AreasIndex (verified: 0 iframes on load → 1 on click).

### Launch foundation (shared)
- **OG image** → `public/images/og-default.jpg` (branded 1200×630 JPG, was an AVIF that won't render on FB/WhatsApp/LinkedIn). `BaseLayout` default updated. Regenerate with `node scripts/generate-og.mjs`.
- **JSON-LD `@graph`** in `BaseLayout` — `Organization` (`#org`, with logo) + `HomeAndConstructionBusiness` (`#business`, 3-county `areaServed`), linked by `@id`. Shared IDs in `src/lib/seo.ts`.
- **Per-page schema** referencing `#business`: `Service` (provider @id, 3-county areaServed) on service pages; `Service`/area on city pages; `Article` (datePublished **+ dateModified** + publisher @id) on blog posts; `og:type=article` + `article:published_time` on posts.
- **Analytics** — Vercel Web Analytics snippet (cookieless) in `BaseLayout` + two events: `tel_click` (any `tel:` link) and `lead_submit` (fires on `/thank-you`). See PENDIENTE.
- **Anti-spam** (`LeadForm.astro` + `api/lead.ts`) — hidden `company_url` honeypot (silent no-op server-side) + best-effort per-IP rate-limit. Verified live: invalid→400, flood→429, honeypot→200 no-write.
- **Palm Beach scaffold** (`areas.ts` + `nav.ts`) — county type + `COUNTY_ORDER` widened to include Palm Beach; index/footer light up automatically once Sanity docs exist. See PENDIENTE.
- **Accessibility** — `.btn--primary`, `.skip-link`, `FinancingTeaser` band/eyebrow, Home hero eyebrow moved off white-on-`--red` (3.98:1) to `--red-dark`/`#fff` (≥5:1). All key pages pass accesslint at serious+ except the items in PENDIENTE.

### Pages elevated
- **ReviewsPage** (was thin) — now: hero + StatsBand credibility + AnswerBlock + reviews carousel + 6-card credentials grid + CTA. (Real reviews = PENDIENTE.)
- **AreasIndexPage** (was thin, #1 SEO surface) — 3-county meta, AnswerBlock, MapEmbed facade, styled per-county directory cards, services strip, StatsBand, internal links.
- **ServicePage ×4** — Service schema, AnswerBlock with **real pricing from the estimator engine**, service-specific FAQ (real HVHZ/cost facts), in-body city links.
- **ServiceAreaPage** — Service @id schema, city-named GEO answer, nearby-city links. City-specific FAQ = PENDIENTE.
- **ContactPage** — map facade, FAQ component (deduped its FAQPage). **FinancingPage** — FAQ component, financing AnswerBlock. **OurWorkPage** — AnswerBlock + StatsBand. **GalleryPage** — related-services strip. **HomePage** — cost/coverage AnswerBlock. **BlogPostPage** — in-code Article schema + OG image.

---

## Definition of Done — global
- [x] Build green, 193 pages (= baseline), no new warnings
- [x] EN + ES both build; ES no overflow at 375px on key pages (h1/h2/.btn/chips checked)
- [x] Map + (no YouTube) embeds are click-to-load → **zero third-party cookies on load**
- [x] JSON-LD graph: business/org @id, Service.provider @id, Article dateModified, single FAQPage/page
- [x] OG default = JPG 1200×630, resolves; analytics + 2 events wired
- [x] `/api/lead`: 400 invalid, 429 rate-limit, honeypot silent no-op — all verified live
- [x] accesslint: all fixable serious/critical resolved on home, service, area, reviews, contact, estimator
- [x] No invented reviews / local facts / pricing — placeholders left as `{{PENDIENTE}}`

---

## `{{PENDIENTE}}` — owner action required

1. **Palm Beach content (priority — #1 SEO surface).** Create `serviceArea` docs in Sanity (`zsdw057t/production`) for the Palm Beach cities you serve (e.g. West Palm Beach, Boca Raton, Delray Beach, Boynton Beach, Jupiter, Wellington, Palm Beach Gardens). Each must clear the anti-doorway bar (≥3 of: ≥2 real geo photos, real local specifics/permits, a city FAQ, a real review, unique title/H1/meta). Then add each slug to `COUNTY_BY_SLUG` and `FOOTER_AREAS` (both in `src/lib/`) under `Palm Beach`. They then appear in the index + footer automatically. Until then Palm Beach is represented in copy + business `areaServed` only.
2. **Video captions (a11y critical).** Service-page and project-video `<video>` elements need WCAG captions. Provide a `.vtt` caption file per video (or confirm the clips have no spoken content) and add `<track kind="captions" src=… srclang=… label=…>`.
3. **Analytics enable.** Turn on **Web Analytics** for the project in the Vercel dashboard (no code ID needed — the snippet + `tel_click`/`lead_submit` events are already wired and queue until enabled).
4. **Real reviews.** Replace the 6 template testimonials in `src/lib/testimonials.ts` with real Google reviews (the Reviews carousel + Google badge are ready).
5. **Pricing review.** `src/lib/pricing.ts` is flagged "COMPETITIVE STARTER — OWNER MUST REVIEW." The estimator AND the new service/home answer blocks read from it — review before go-live.
6. **Financing terms.** No real Synchrony APR/term example is shown (would be fabricated). Provide real terms to add a monthly-payment example.
7. **Known minor a11y (logged, not blocking):** Header mobile `.bottombar` is outside a landmark region (moderate, pre-existing); hero text over the video reads ~4.3:1 to accesslint's static estimate but is legible via the scrim + text-shadow — verify visually.
8. **ES CMS content / translation:** `scripts/translate.mjs` does **not** exist in the repo. `{{PENDIENTE: translation script absent}}` — translate Sanity ES fields manually or add a script.

---

## Publish steps (owner)
1. Review/approve `pricing.ts`; replace `testimonials.ts` with real reviews; add Palm Beach Sanity docs + slugs.
2. Enable Vercel Web Analytics; (optional) `cd studio && npm run deploy` to see schemas in Studio.
3. Deploy `web/` to Vercel.
4. Submit `sitemap-index.xml` to Google Search Console; request reindex of redirected URLs.
5. Confirm the Google Business Profile NAP matches (AB Aluminum & Screens · +1-786-383-6066 · Mo-Fr 08:00-18:00 · Miami-Dade + Broward + Palm Beach).

## Nice-to-have (not done, optional)
`vercel.json` security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, HSTS); dedicated 500 page; self-hosted woff2 preload for the hero LCP weight (skipped — @fontsource hashes URLs, so a naive preload double-downloads).
