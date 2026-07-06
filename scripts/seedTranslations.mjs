/**
 * Seeds high-value Spanish translations authored by hand (blog category names +
 * the 4 service pages' H1/intro/meta) so /es/ reads Spanish out of the box.
 * The full 40-post + 32-area translation is done by translate.mjs (needs an API key).
 *
 * Run: node seedTranslations.mjs   (--dry to preview)
 */
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const CMS_DIR = '/Users/senavia/Sites/ab-aluminum/source/CMS Webflow AB Aluminum And Screens'
const DRY = process.argv.includes('--dry')
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

const categories = {
  'blogCategory-costs-financing': 'Costos y Financiamiento',
  'blogCategory-louvered-roofs': 'Techos de Lamas',
  'blogCategory-pergolas-patio-covers': 'Pérgolas y Cubiertas',
  'blogCategory-permits-codes': 'Permisos y Códigos',
  'blogCategory-pool-enclosures': 'Cerramientos de Piscina',
  'blogCategory-screen-rooms': 'Porches con Malla',
}

const services = {
  'service-6a2733c3afab69df172f3608': {
    titleEs: 'Techos de Lamas Motorizados',
    heroEs: {
      heading: 'Techos de Lamas Motorizados en el Sur de Florida',
      paragraph:
        'Techos de aluminio ajustables que se abren al sol y se cierran con la lluvia — diseñados, tramitados e instalados por un equipo local con licencia.',
    },
    introEs: {
      heading: 'Qué es un Techo de Lamas Motorizado y Cómo Funciona',
      paragraph:
        'Un techo de lamas motorizado es una cubierta de patio de aluminio con láminas giratorias que se inclinan para controlar la luz del sol y se sellan para mantener la lluvia afuera. Las láminas se ajustan al instante, así que puedes tener sol total, sombra total o cualquier punto intermedio. AB Aluminum & Screens diseña e instala estos sistemas en Miami-Dade, Broward y Palm Beach.',
    },
    seoEs: {
      metaTitle: 'Techos de Lamas en Miami-Dade y Broward | AB Aluminum',
      metaDescription:
        'Techos de lamas motorizados diseñados e instalados en Miami-Dade, Broward y Palm Beach. Láminas de aluminio ajustables, control inteligente. Diseño 3D gratis.',
    },
  },
  'service-6a2739e07e57d57b3c1dd4db': {
    titleEs: 'Porches con Malla',
    heroEs: {
      heading: 'Contratistas de Porches con Malla en el Sur de Florida',
      paragraph:
        'Porches con malla de aluminio a medida — estilo lanai, envolventes o adosados — que convierten un patio expuesto en una habitación exterior sin insectos, diseñados, tramitados e instalados por un equipo local con licencia.',
    },
    introEs: {
      heading: 'Lo que un Porche con Malla Aporta a tu Hogar',
      paragraph:
        'Un porche con malla es un cerramiento con estructura de aluminio que convierte un patio o porche abierto en una habitación exterior sombreada y sin insectos que puedes usar todo el año. Mantiene afuera los insectos, la basura y el sol intenso mientras deja pasar la brisa. AB Aluminum & Screens diseña, tramita e instala porches con malla a medida en Miami-Dade, Broward y Palm Beach.',
    },
    seoEs: {
      metaTitle: 'Contratistas de Porches con Malla en el Sur de Florida | AB',
      metaDescription:
        'Diseño, permisos e instalación de porches con malla a medida en Miami-Dade, Broward y Palm Beach. Contratistas de aluminio con licencia. Consulta de diseño 3D gratis.',
    },
  },
  'service-6a2733888f82f88cf6f12737': {
    titleEs: 'Pérgolas y Cubiertas de Patio',
    heroEs: {
      heading: 'Contratistas de Pérgolas y Cubiertas de Aluminio en el Sur de Florida',
      paragraph:
        'Pérgolas de aluminio a medida, cubiertas de patio y soluciones de vida al aire libre para propietarios del sur de Florida. Aumenta el confort, la sombra y el valor de tu propiedad con diseño profesional, permisos, instalación y una construcción duradera resistente al clima.',
    },
    introEs: {
      heading: 'Por Qué las Pérgolas y Cubiertas de Aluminio Son Perfectas para el Sur de Florida',
      paragraph:
        'Una pérgola o cubierta de patio de aluminio convierte un patio caluroso y expuesto en una habitación exterior con sombra que puedes usar durante la temporada de lluvias y los meses de mucho sol de Florida. A diferencia de la madera, el aluminio no se deforma, no se pudre ni atrae termitas. AB Aluminum & Screens diseña, tramita e instala estructuras a medida en Miami-Dade, Broward y Palm Beach.',
    },
    seoEs: {
      metaTitle: 'Cubiertas y Pérgolas de Aluminio en el Sur de Florida | AB',
      metaDescription:
        'Pérgolas y cubiertas de aluminio a medida diseñadas, tramitadas e instaladas en Miami-Dade, Broward y Palm Beach. Con licencia. Consulta de diseño 3D gratis.',
    },
  },
  'service-6a2739c9b44e7519674644be': {
    titleEs: 'Cerramientos de Piscina',
    heroEs: {
      heading: 'Contratistas de Cerramientos de Piscina en el Sur de Florida',
      paragraph:
        'Jaulas de piscina de aluminio a medida que mantienen afuera la basura, los insectos y los accesos no deseados — diseñadas, tramitadas e instaladas por un equipo local con licencia.',
    },
    introEs: {
      heading: 'Qué Hace un Cerramiento de Piscina por tu Hogar',
      paragraph:
        'Un cerramiento de piscina —o “jaula de piscina”— es una estructura con malla y marco de aluminio construida alrededor de tu piscina para mantener afuera la basura, los insectos y los accesos no deseados, además de ampliar las horas en que puedes usarla. AB Aluminum & Screens diseña, tramita e instala cerramientos de piscina a medida en Miami-Dade, Broward y Palm Beach.',
    },
    seoEs: {
      metaTitle: 'Contratistas de Cerramientos de Piscina en el Sur de Florida | AB',
      metaDescription:
        'Diseño, permisos e instalación de cerramientos de piscina con licencia en Miami-Dade, Broward y Palm Beach. Calculado según el código. Consulta de diseño 3D gratis.',
    },
  },
}

const main = async () => {
  let tx = client.transaction()
  let n = 0
  for (const [id, titleEs] of Object.entries(categories)) {
    if (DRY) console.log(`${id} -> ${titleEs}`)
    else tx = tx.patch(id, (p) => p.set({titleEs}))
    n++
  }
  for (const [id, fields] of Object.entries(services)) {
    if (DRY) console.log(`${id} -> ${fields.titleEs}`)
    else tx = tx.patch(id, (p) => p.set(fields))
    n++
  }
  if (DRY) return console.log(`(dry) ${n} docs`)
  const res = await tx.commit()
  console.log(`Patched ${n} docs (${res.results.length} ops).`)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
