# AB Aluminum & Screens — Sanity CMS

Sanity project: **`zsdw057t`** / dataset **`production`** (público para lectura).

```
ab-aluminum/
├── studio/     Sanity Studio (schemas + UI de edición)
└── scripts/    Importador one-shot del export de Webflow
```

## Studio (gestión de contenido + subir multimedia)

```bash
cd studio
npm install
npm run dev       # http://localhost:3333
npm run deploy    # publica el Studio en https://<nombre>.sanity.studio
```

Tipos de contenido: `service` (4), `blogPost` (40) + `blogCategory` (6),
`serviceArea` (32), `galleryCollection` (4 galerías). Las imágenes se suben como
assets de Sanity (CDN + transforms automáticos); los videos siguen en R2.

## Import (ya ejecutado una vez)

```bash
cd scripts
npm install
node import.mjs --dry    # simula (sin escribir)
node import.mjs          # importa: sube imágenes + crea docs publicados
```

- Lee el contenido local de `~/Downloads/CMS Webflow AB Aluminum And Screens/`.
- Token desde `sanity.env` (no se comitea).
- `_id` derivado del Webflow Item ID → re-ejecutar **actualiza**, no duplica.
  Re-importar sobrescribe ediciones hechas en el Studio.
