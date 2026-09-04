# Handoff — AB Aluminum & Screens · Conversion Tracking (Google Ads / GTM / GA4)

> Nota: existe otro `handoff.md` en esta carpeta de una sesión distinta (2026-06-26, "Quality Uplift + Launch Hardening"). Este documento es aparte y cubre SOLO el trabajo de rastreo de conversiones.

**Fecha:** 2026-07-24 · **Sitio:** https://www.abaluminumandscreens.com · **Repo:** `~/Sites/ab-aluminum/web` (Astro 5 + Sanity + Vercel)
**Deploy:** `git push origin main` → Vercel (Git integration, rootDir `web/`)

**IDs clave:**
- GTM container: `GTM-MBXMC32G`
- GA4: `G-R5QHZW8J1L`
- Google Ads: `AW-16651639489` (cuenta 334-444-9121)
- Label conversión de lead (formularios): `T4ykCPqtrZMaEMG1j4Q-`
- Labels teléfono GFN: `VUwpCOjwvdAcEMG1j4Q-` (786-383-6066) · `T9bmCOvwvdAcEMG1j4Q-` (786-340-5157)

---

## 1. Objetivo

Arreglar el rastreo de conversiones de Google Ads: **llegaban leads (correos/Sanity) pero Google Ads registraba 0–1 conversiones**. Objetivos concretos que surgieron:
1. Que GA4 conecte con el sitio (mostraba "recogida de datos no activada").
2. Que las conversiones de **formulario** se registren en Google Ads.
3. Eliminar conversiones **fantasma** (bots / refresh / visitas directas).
4. Verificar que **los 4 formularios** (contacto, footer/LeadSection, estimador, galería) rastreen bien.
5. Verificar el **teléfono** (call reporting / GFN).
6. Auditoría de experto: que **todas las páginas** tengan los tags y estén bien configuradas.
7. Saber **qué leads vienen de Google Ads vs orgánicos** (atribución por lead).

---

## 2. Estado en que terminó

**✅ RESUELTO Y LIVE EN PRODUCCIÓN:**
- **GA4** conecta y recibe datos (se publicó la Google Tag `G-R5QHZW8J1L` dentro de GTM).
- **Conversión de formulario** registra en Ads (acción "Lead – Envío de formulario", Principal, Activa).
- **Conversiones fantasma eliminadas** (código + trigger de GTM por evento).
- **GTM** dispara la conversión de lead por el evento `generate_lead` (publicado).
- **Los 4 formularios** verificados: todos → `/thank-you` → `generate_lead` (1 sola vez).
- **Teléfono**: call reporting ON confirmado; las 2 acciones GFN son **nuevas** → 0 es esperado, no es bug.
- **Anti-bot suavizado** (dejaba caer usuarios reales rápidos/autofill).
- **Atribución por lead** (gclid/UTM/referrer) en cada correo de notificación.

**🟡 PENDIENTE (opcional / no urgente):** ver sección 5.

**⚠️ Nota de repo:** al cerrar, el checkout local estaba en la rama `feat/local-louvered-plus-persqft-fixes` (trabajo SEO de **otra sesión en paralelo**, 1 commit sin pushear `14fc3f5`). **`origin/main` = `becc958`** (mi último commit) — es lo que produce Vercel. Todos mis cambios están en `origin/main` y live.

---

## 3. Archivos y cambios

**Commits en `origin/main` (todos desplegados):**

| Commit | Qué hizo |
|---|---|
| `cf184be` | Guarda `result.id`: solo redirige/dispara conversión si el lead se guardó de verdad (mata fantasmas de bots que reciben 200 sin id). |
| `6cb5ffc` | Flag `ab_lead` de una sola vez: `/thank-you` dispara `generate_lead` exactamente 1 vez por envío real (refresh/back/directo no re-disparan). |
| `4210c4e` | Anti-bot suavizado: honeypot `company_url`→`ref_id` (autofill ya no lo llena), time-trap `2500ms`→`1000ms`. |
| `becc958` | Atribución por lead: captura gclid/UTM/referrer → guarda en Sanity + fila "Source" en el correo. (+116 líneas, 0 borrados) |

**Archivos tocados (código):**
- `src/lib/attribution.ts` **(nuevo)** — `getAttribution()` (captura en navegador, nunca lanza) + `classifySource()` (clasificador puro server: Google Ads / Organic / Referral / Social / AI / Direct) + `parseGclAw()`.
- `src/components/LeadForm.astro` — import + envía `attribution` en el body; guarda `result.id` + `ab_lead` + redirect (commits previos).
- `src/components/pages/EstimatorPage.astro` — import + envía `attribution`.
- `src/pages/api/lead.ts` — parsea/normaliza `attribution` (8 keys, string-cap) → lo guarda en el doc; honeypot `ref_id`; time-trap 1000ms.
- `src/lib/mailer.ts` — fila **"Source"** en el correo interno (verde `#0b8043` si Google Ads); valores escapados (XSS-safe).
- `src/components/pages/ThankYouPage.astro` — push `generate_lead` gated por `ab_lead` (commit previo).

**Cambios de configuración (hechos por el usuario en las consolas, NO código):**
- **GTM:** creó trigger `CE - generate_lead` (Custom Event, `generate_lead`, All Custom Events); cambió el trigger del tag "Contact Form Submitted" de "Booking Confirmation Page" (ruta) → `CE - generate_lead`; **Publicó**. También publicó la Google Tag GA4.
- **Google Ads:** renombró "Booking Confirmation" → **"Lead – Envío de formulario"** y la puso **Principal** (Include in Conversions = Yes). Puso las 3 acciones de teléfono como Principales. Confirmó **Informes de llamadas = Activado**.

---

## 4. Qué se intentó y qué falló (callejones / falsas alarmas)

- **GA4 parecía no disparar** (primer diagnóstico): el navegador servía un `gtm.js` en **caché** pre-publicación. Falsa alarma — se resolvió haciendo `fetch(..., {cache:'no-store'})` del contenedor publicado. Lección: verificar el contenedor publicado, no el cacheado.
- **Test de swap GFN con `gclid` falso** → el número no se intercambiaba. **Falsa alarma**: Google solo sirve el número de reenvío a clics de anuncio **reales**. NO es problema de configuración.
- **Google Ads API (Composio)** quedó **rate-limited (~16h)** a mitad de sesión → no se pudo re-consultar acciones de conversión en vivo en algunos momentos; se usó evidencia de capturas + GA4.
- **Poll en background del deploy de atribución** falló (exit 1) por un momento transitorio del build de Vercel → se verificó manualmente (chunk `attribution.C9Z16MJt.js` live con `_gcl_aw`).
- **Estimador — guarda más débil (`data.ok` vs `data.id`)**: detectado como riesgo **latente** de conversión-fantasma con valor. **NO se arregló** (hoy no es explotable: el estimador no manda honeypot ni `elapsedMs`). Ver paso 5.
- **`/gallery` (índice) devuelve 404** en producción (solo existen `/gallery/[categoria]`). Es routing/SEO, **no** de tracking (el 404 sí lleva tags).

---

## 5. Pasos siguientes exactos

**A. Prueba del usuario (inmediata):**
1. Visita `https://www.abaluminumandscreens.com/contact-us?gclid=TEST123` → llena y envía → el correo debe mostrar **Source: 🟢 Google Ads · gclid TEST123**.
2. Visita normal (sin `?gclid=`) y envía → **Source: Direct / Organic / Referral**.
3. Confirmar en el correo: (a) el lead llega, (b) aparece fila "Source" bajo Phone, (c) el correo de confirmación al prospecto llega. *(Cada prueba real = 1 lead + 1 conversión en Ads.)*

**B. GA4 `generate_lead` (GTM, ~5 min) — para que GA4 cuente TODOS los formularios por canal:**
1. GTM → Tags → New → **Google Analytics: GA4 Event**.
2. Configuration tag = la Google Tag de GA4 (`G-R5QHZW8J1L`); Event Name = `generate_lead`.
3. Trigger = `CE - generate_lead`. Save → **Submit → Publish**.
4. GA4 → Admin → Events → marcar `generate_lead` como conversión (key event).

**C. (Opcional) Fix de paridad del estimador — cierra el fantasma latente:**
- En `src/components/pages/EstimatorPage.astro:2070` cambiar `if (!res.ok || !data.ok) throw` → `if (!res.ok || !data.id) throw`. Commit + `git push origin main`.

**D. (Opcional) Higiene doble-carga AW-16651639489:**
- `AW-16651639489` se carga 2× (gtag suelto en `BaseLayout.astro:94-105` + Google Tag dentro de GTM). No duplica conversiones, pero es redundante. Elegir **un** dueño: o mover el number-swap de teléfono a GTM y borrar el gtag suelto, o quitar la Google Tag de AW de GTM. Requiere decisión + prueba en GTM Preview.

**E. Teléfono:** esperar volumen real de llamadas desde clics de anuncio; las GFN pasarán de "Esperando" a "Registrando". Verificar que las 3 acciones sigan Principales.

**F. `/gallery` 404:** redirect 301 a `/our-work` o crear índice real (routing/SEO).

**G. Seguridad (arrastre):** rotar secretos en texto plano de `~/Sites/ab-aluminum/web/.env`.

**H. Repo:** el commit local `14fc3f5` (SEO louvered, otra sesión) está sin pushear — coordinar con esa sesión antes de pushear/mergear para no pisar trabajo.

---

## 6. Resumen del chat (cronológico)

1. **GA4 no conectaba** ("recogida de datos no activada"). Causa: la Google Tag de GA4 estaba en GTM pero **sin publicar** el contenedor. Se publicó → GA4 live.
2. **Google Ads no registraba conversiones de formulario** pese a que el Tag Assistant decía "Succeeded". Causa raíz: la acción de conversión ("Booking Confirmation") tenía **"Incluir en Conversiones = No"**. Se renombró a "Lead – Envío de formulario" y se puso **Principal** → empezó a registrar.
3. **Conversiones fantasma**: el código redirigía a `/thank-you` con solo `res.ok`, pero el honeypot/time-trap devuelven 200 sin `id` → bots disparaban conversión. Fix `cf184be` (gate `result.id`) + `6cb5ffc` (flag `ab_lead` de una vez).
4. **GTM**: se movió el disparo de la conversión de lead de "ruta contiene thank-you" al **evento `generate_lead`** (trigger `CE - generate_lead`). Verificado en Tag Assistant (Fired/Succeeded) y en el contenedor publicado. Publicado.
5. **Verificación de los 4 formularios** (workflow de 9 agentes): todos → `/thank-you` → `generate_lead`. Hallazgo: **el "footer" NO tiene formulario** — es el `LeadSection` sobre el footer (sí rastreado). Estimador con guarda `data.ok` (latente).
6. **Teléfono**: las 3 acciones Principales en 0/"Esperando". Aclarado por el usuario: las 2 GFN son **nuevas** → 0 esperado. Confirmado **call reporting ON**. Falsa alarma del swap (gclid falso).
7. **Auditoría de experto (código)**: cobertura de tags **completa** en las 43 rutas (todas vía `BaseLayout`, incl. 404 y `/es`); GA4 carga 1×; hallazgos menores (estimador `data.ok`, fail-open en ThankYouPage, doble-carga AW).
8. **Anti-bot suavizado** (`4210c4e`): honeypot `ref_id`, time-trap 1000ms — dejaba caer usuarios reales rápidos.
9. **Atribución por lead** (`becc958`): captura gclid/UTM/referrer → guarda en Sanity + fila "Source" en el correo. Explicado cómo Google sabe si una conversión viene de Ads (**cookie `_gcl_aw`/gclid**) vs orgánica (canal por referrer). De ~8 leads en 14 días, ~1-2 de Ads y el resto orgánico/directo/pruebas.
10. Verificado todo end-to-end (build, bundle live, `origin/main`, preview del correo, XSS-safe). Pendiente: la prueba real del usuario.
