# AB Aluminum & Screens — Plan de Implementación SEO/GEO/AEO

**Fuente:** auditoría pre-optimización (18 hallazgos, `~/.claude/plans/…-synthetic-gray.md`).
**Repo:** `~/Sites/ab-aluminum/web` (Astro 5 SSG · Sanity `zsdw057t/production` · Vercel).
**Deploy:** `git push origin main` (Vercel Git integration, monorepo rootDir=web). NO deploy en cada paso — el owner publica.
**Regla de verificación por lote:** `cd web && npm run build` verde (193 pág.) → re-inspeccionar `dist/client` → confirmar en Rich Results / accesslint según aplique.

> **Correcciones al reporte** (verificadas leyendo el código): el nodo `LocalBusiness`/`Organization` vive en `web/src/layouts/BaseLayout.astro:41-71`, **no** en `seo.ts` (ahí solo están los `@id`). El campo `hero.heading` de servicios **ya existe** en el schema Sanity (`studio/schemaTypes/documents/service.ts:30-35`) — fix #1 es solo contenido. El schema `serviceArea` **no** tiene campo FAQ — hay que añadirlo.

---

## 0. Prerrequisitos — datos que necesito del owner (desbloquean lotes)

Sin esto, esos ítems quedan con placeholder o no se pueden hacer:

| Dato | Desbloquea | Si no llega |
|---|---|---|
| **# de licencia FL** (CBC/CGC/SCC) | #6 (footer + About + schema `hasCredential`) | Se deja `{{LICENSE}}` visible, no se inventa |
| **Dirección física + lat/lng** (o confirmar "solo área servida, sin storefront") | #3 (LocalBusiness `address`+`geo`) | Se usa ciudad base (Miami) + `areaServed`, sin street |
| **Confirmar stats reales** ("15+ años", "500+ proyectos") | #7 (ya están en `StatsBand.astro`, solo confirmar que son verídicos) | Se corrigen a los reales antes de mostrarlos estáticos |
| **Reseñas Google reales** (mín. 5-10) | #14 (`testimonials.ts` + `AggregateRating`) | Sin `AggregateRating` (no se fabrican reseñas) |
| **Decisiones de canibalización** (§ Decisiones) | Lote 3 | Se toma la recomendación por defecto |

Todo lo demás (Lote 1 completo) no depende de nada externo.

---

## Lote 1 — Quick wins de código (sin dependencias) · ~medio día

Todos son cambios de código puros, verificables en el build. Hacer en una sola rama/commit lógico.

### 1.1 · Excluir `thank-you` del sitemap (#4)
**Archivo:** `web/astro.config.mjs` (integración `sitemap()`, ~línea 44).
**Cambio:** añadir `filter` a la config del sitemap:
```js
sitemap({
  filter: (page) => !/\/thank-you\/?$/.test(page),
  i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
}),
```
**Verificar:** `grep thank-you dist/client/sitemap-0.xml` → 0 resultados.

### 1.2 · `og:locale:alternate` + recorte de title del home (#5)
**Archivo:** `web/src/layouts/BaseLayout.astro:115` — tras `<meta property="og:locale" …>` añadir:
```astro
<meta property="og:locale:alternate" content={lang === 'es' ? 'en_US' : 'es_US'} />
```
**Title home:** el string largo (~99c) lo pasa `HomePage.astro` (objeto `copy[lang]`). Recortar a ~60c liderando con keyword, p.ej. EN `"Pergola & Pool Enclosure Contractors in South Florida | AB Aluminum"`, ES `"Contratistas de Pérgolas y Cerramientos — Sur de Florida | AB Aluminum"`. Editar en `web/src/components/pages/HomePage.astro` (objeto de copy del `<title>`/`seo`).
**Verificar:** `dist/client/index.html` → `<title>` ≤ ~62c, `og:locale:alternate` presente.

### 1.3 · StatsBand: valor final en SSR (#7)
**Archivo:** `web/src/components/StatsBand.astro:30`.
**Cambio (1 línea):** el fallback estático debe ser el número final, no `0`:
```astro
<!-- antes -->
<span data-count={s.count} data-count-suffix={s.suffix}>0{s.suffix}</span>
<!-- después -->
<span data-count={s.count} data-count-suffix={s.suffix}>{s.count}{s.suffix}</span>
```
La animación count-up (`BaseLayout.astro:169`) sigue funcionando (sobreescribe `textContent` al hacer scroll). Crawlers/IA sin JS ahora ven "15+ / 500+ / 3 / 100%".
**Prerequisito:** confirmar que 15/500 son reales (§0). Usado en About (`AboutPage.astro:88`) y Reviews.
**Verificar:** `grep -o '0+ Years' dist/client/about-us/index.html` → vacío; debe aparecer `15+`.

### 1.4 · Palm Beach en el footer (#8)
**Archivo:** `web/src/lib/nav.ts` — añadir 3er bloque a `FOOTER_AREAS` (línea 84, quitar el comentario `{{PENDIENTE}}`). Slugs válidos ya en `areas.ts`:
```ts
{
  county: { en: 'Palm Beach', es: 'Palm Beach' },
  cities: [
    { slug: 'west-palm-beach', name: 'West Palm Beach' },
    { slug: 'boca-raton', name: 'Boca Raton' },
    { slug: 'delray-beach', name: 'Delray Beach' },
    { slug: 'boynton-beach', name: 'Boynton Beach' },
    { slug: 'jupiter', name: 'Jupiter' },
    { slug: 'wellington', name: 'Wellington' },
  ],
},
```
**Verificar:** `grep -c 'service-areas/boca-raton' dist/client/index.html` ≥ 1.

### 1.5 · `llms.txt` (#12)
**Archivo nuevo:** `web/public/llms.txt`. Hechos de entidad citables (dejar `{{LICENSE}}` si aún no hay #):
```
# AB Aluminum & Screens
Aluminum outdoor-structure contractor in South Florida.
Services: aluminum pergolas, pool screen enclosures, patio screen rooms, screen rooms, motorized louvered roof systems, patio covers, custom aluminum structures.
Area served: Miami-Dade, Broward, Palm Beach (FL).
Engineered to Miami-Dade HVHZ (High-Velocity Hurricane Zone) wind-load code, up to 175 mph.
Licensed & insured. FL license: {{LICENSE}}. 15+ years, 500+ projects.
Phone (EN): (786) 383-6066 · (ES): (786) 340-5157 · info@abaluminumandscreens.com
Site: https://www.abaluminumandscreens.com  ·  Free 3D design + financing (Synchrony).
```
**Verificar:** `curl` local / existe `dist/client/llms.txt`.

### 1.6 · `telephone` array [EN, ES] en el schema (#3 parcial)
**Archivo:** `web/src/layouts/BaseLayout.astro:59`.
```astro
telephone: ['+1-786-383-6066', '+1-786-340-5157'],
```
**Verificar:** Rich Results Test sobre el home → `telephone` con 2 valores, sin error.

### 1.7 · Twitter/theme-color/apple-touch-icon + `.bottombar` landmark (#16, #18)
- `web/src/layouts/BaseLayout.astro:116` — añadir bajo `twitter:card`:
  ```astro
  <meta name="twitter:title" content={title} />
  {description && <meta name="twitter:description" content={description} />}
  <meta name="twitter:image" content={ogImage} />
  <meta name="theme-color" content="#001994" />
  <link rel="apple-touch-icon" href="/favicon.png" />
  ```
- `web/src/components/Header.astro:165` — envolver `.bottombar` en landmark:
  ```astro
  <nav class="bottombar" aria-label={lang === 'es' ? 'Acciones rápidas' : 'Quick actions'}> … </nav>
  ```
**Verificar:** accesslint sobre home móvil → desaparece el warning de landmark; `dist` tiene los meta twitter.

**➡ Verificación de Lote 1:** `npm run build` verde, re-correr las comprobaciones anteriores, Rich Results sobre home. Commit: "SEO quick wins: sitemap filter, OG/twitter, StatsBand SSR, Palm Beach footer, llms.txt".

---

## Lote 2 — Completar LocalBusiness (#3 resto) · bloqueado en §0 dirección/licencia

**Archivo:** `web/src/layouts/BaseLayout.astro:62-66` (nodo `HomeAndConstructionBusiness`).
Con dirección real:
```astro
address: {
  '@type': 'PostalAddress',
  streetAddress: '{{STREET}}',
  addressLocality: '{{CITY}}',
  addressRegion: 'FL',
  postalCode: '{{ZIP}}',
  addressCountry: 'US',
},
geo: { '@type': 'GeoCoordinates', latitude: {{LAT}}, longitude: {{LNG}} },
hasMap: '{{GBP_or_maps_url}}',
```
Añadir licencia como credencial (#6):
```astro
hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: 'FL Contractor License', identifier: '{{LICENSE}}' },
```
Y publicar el # de licencia en `Footer.astro` (línea NAP) + `AboutPage.astro`.
**Verificar:** Rich Results → LocalBusiness con address+geo, 0 errores; licencia visible en footer del build.

---

## Lote 3 — Keyword on-page de servicios (#1) + canibalización · CMS + decisiones

**Naturaleza:** contenido en Sanity Studio (`hero.heading` + `heroEs.heading` + `seo.metaTitle`/`seoEs`), el schema ya lo soporta. Sin cambio de código.

**Por servicio** (documento `service` en Sanity), poblar `hero.heading` y `seo.metaTitle` con la keyword comercial + geo:

| Slug | `hero.heading` (H1) EN | `seo.metaTitle` EN |
|---|---|---|
| aluminum-pergolas | Aluminum Pergola Contractors in South Florida | Aluminum Pergola Contractors — Miami-Dade & Palm Beach \| AB Aluminum |
| pool-enclosure | Pool Enclosure Contractors in South Florida | Pool & Pool Screen Enclosure Contractors — South Florida \| AB Aluminum |
| patio-screens | Patio Screen & Screen Room Contractors | Patio Screen & Screen Room Contractors — South Florida \| AB Aluminum |
| louvered-roof-system | Louvered Roof & Motorized Pergola Contractors | Motorized Louvered Roof Contractors — South Florida \| AB Aluminum |

(+ equivalentes ES en `heroEs.heading` / `seoEs.metaTitle`.)

**Canibalización (aplicar en la misma pasada de copy):**
1. `patio-screens` concentra "patio screen" + "screen room" con H2 dedicado "Screen Room Contractors" (recomendado: NO crear `/screen-rooms` por ahora).
2. "motorized pergolas" → dueño = `louvered-roof-system` (H2/copy); `aluminum-pergolas` se queda con "custom/aluminum pergolas" + "patio covers".
3. "aluminum structures / aluminum contractors" → sección/H2 en el Home (o service page futura). Decisión del owner.

**Verificar:** rebuild → `dist/client/aluminum-pergolas/index.html` `<h1>` contiene "Contractors"; title ≤ ~62c. GSC (semanas después): CTR de las 4 páginas sube.

---

## Lote 4 — Diferenciación de city pages + FAQ por ciudad (#13, #10) · el más grande

Es el trabajo de mayor impacto local y el de mayor esfuerzo. Tres partes:

### 4.1 · Añadir campo FAQ al schema `serviceArea` (código Studio)
**Archivo:** `studio/schemaTypes/documents/serviceArea.ts` — añadir en el grupo principal y en `es`:
```ts
defineField({ name: 'faq', title: 'FAQ', type: 'array', group: 'content',
  of: [{ type: 'object', fields: [
    { name: 'q', type: 'string' }, { name: 'a', type: 'text' },
  ]}]}),
defineField({ name: 'faqEs', title: 'FAQ (ES)', type: 'array', group: 'es',
  of: [{ type: 'object', fields: [
    { name: 'q', type: 'string' }, { name: 'a', type: 'text' },
  ]}]}),
```
Luego `cd studio && npm run deploy` (o `deploy_schema` MCP) para verlo en Studio.

### 4.2 · Renderizar el FAQ en el template (código web)
**Archivo:** `web/src/components/pages/ServiceAreaPage.astro` — quitar el `{{PENDIENTE: city-specific FAQ}}`, leer `faq`/`faqEs` del doc Sanity y montar el componente existente:
```astro
{faqItems?.length > 0 && <FAQ lang={lang} items={faqItems} />}
```
(reactiva el `FAQPage` JSON-LD por ciudad automáticamente — el emisor está en `FAQ.astro`).

### 4.3 · Contenido único por ciudad (Sanity, por tandas)
Meta medible: bajar el solapamiento de 8-gramas inter-ciudad de **~45% a <25%**. Por ciudad, poblar en Sanity:
- `paragraph1/2` con contexto local real (barrios, clima costero/salino, código municipal, permisos de esa ciudad).
- `services[].paragraph` específico (no genérico).
- ≥1 foto de proyecto **real** en esa ciudad, con `imageAlt` geo-etiquetado.
- 2-3 FAQ locales: "¿Necesito permiso para una pérgola en {ciudad}?", "¿Cuánto cuesta un pool cage en {ciudad}?".
- Reseña local si existe.

**Tandas:** Tanda 1 = 15-20 ciudades prioritarias (Miami, Coral Gables, Coral Springs, Boca Raton, West Palm Beach, Fort Lauderdale, Hollywood, Pembroke Pines, Weston, Kendall, Doral, Hialeah, Miami Beach, Delray Beach, Jupiter…). Tanda 2 = las 27 restantes.
**Verificar:** re-correr el jaccard 8-gramas (script de la auditoría) entre 3 pares de ciudades → <25%; Rich Results FAQPage sobre 1 city page.

---

## Lote 5 — AEO tablas + reseñas/AggregateRating (#11, #14)

### 5.1 · Tabla de tamaños/precios en service pages (#11)
**Archivo:** `web/src/components/pages/ServicePage.astro` (o un componente `PricingTable.astro` nuevo, mínimo). Tabla real "Tamaño → rango $" (10×10, 12×16, 16×20…) leyendo de `pricing.ts` (ya existe el motor). Formato `<table>` semántico para featured snippet.
**Verificar:** la tabla aparece en el build; datos coherentes con `pricing.ts`.

### 5.2 · Reseñas reales + AggregateRating (#14) · bloqueado en §0 reseñas
- Reemplazar los 7 placeholders en `web/src/lib/testimonials.ts` por reseñas Google reales.
- Emitir `AggregateRating` en el nodo `#business` (`BaseLayout.astro`) **solo si hay reseñas reales** (ratingValue, reviewCount reales — no inventar).
**Verificar:** Rich Results → estrellas sin error de "review sin datos".

---

## Lote 6 — Accesibilidad restante (#9, contraste)

### 6.1 · Captions de video (#9)
`<video>` en `HomePage.astro:106` (hero, muted → declarar sin diálogo, OK), `VideoPage.astro:36` y service pages: para clips con audio hablado, crear `.vtt` por video + `<track kind="captions" src=… srclang label>`. Si los clips no tienen habla, documentarlo (no requieren track).
### 6.2 · Contraste hero (#12 dim)
Verificar visualmente el hero sobre video; el scrim (50-66%) + text-shadow ya ayudan. Si accesslint/WebAIM marca <4.5:1 en el peor frame, subir opacidad del scrim en `HomePage.astro` (`.home-hero::after`).
**Verificar:** accesslint serious+ limpio en home/videos.

---

## Verificación global + publicación

1. `cd web && npm run build` → exit 0, 193 pág. (o más si crecen city FAQ), sin warnings nuevos.
2. Re-inspeccionar `dist/client`: sitemap (sin thank-you), heads (title/og/twitter/hreflang), JSON-LD (LocalBusiness completo, Service con "contractors", FAQPage en city pages).
3. **Rich Results Test** (Google) sobre: home, 1 service page, 1 city page, 1 blog post.
4. **accesslint** sobre home, service, city, contact (serious+ limpio).
5. `git push origin main` → Vercel despliega. Post-deploy: **activar Web Analytics** en el dashboard de Vercel (#2), y opcional Speed Insights.
6. GSC: reenviar sitemap, vigilar "duplicada, sin canónica" en city pages (baja si Lote 4 va bien).

---

## Orden recomendado (dependencias)

```
Lote 1 (código, ya)  ──►  push + activar Web Analytics
Lote 3 (CMS servicios, ya — no depende de código)      } en paralelo con Lote 1
Lote 2 (schema local)      ◄─ requiere dirección/licencia del owner
Lote 4.1+4.2 (schema+template FAQ)  ──►  Lote 4.3 (contenido por tandas, continuo)
Lote 5.1 (tabla precios)   } cuando Lote 1 esté deployado
Lote 5.2 + #6 licencia     ◄─ requiere reseñas / licencia del owner
Lote 6 (a11y)              } cuando lleguen los .vtt o se confirme "sin diálogo"
```

**Camino crítico al mayor impacto de ranking:** Lote 1 + Lote 3 (rápidos, esta semana) → Lote 4 (contenido local, semanas). Lo demás es refuerzo.

---

## Decisiones abiertas (necesito respuesta para cerrar el plan)
1. **`/screen-rooms`**: ¿página propia o consolidar en `/patio-screens`? (recomiendo consolidar).
2. **"aluminum structures"**: ¿sección en Home, o nueva service page "Custom Aluminum Structures"?
3. **Dirección**: ¿hay storefront público con dirección/mapa, o solo área servida?
4. **Ejecución**: ¿empiezo por el Lote 1 (código, sin bloqueos) ya mismo?

---

## Fuera de alcance (off-site — no es trabajo de código)
GBP (reclamar/optimizar), campaña de reseñas Google, citations (Yelp/Houzz/Angi/BBB), backlinks, validación de volúmenes de keyword (Ahrefs/Semrush). Ver §"Fuera de alcance" de la auditoría.
