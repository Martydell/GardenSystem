# Marty's Plant Haven — Project Context

## Purpose
Marty's personal plant catalogue, care tracker & garden reference — deployed
as a PWA at [martyshaven.netlify.app](https://martyshaven.netlify.app/).
Built iteratively with Claude, plant by plant / batch by batch.

## Current State (as of 2026-07-09)
- **83 plants total:** 51 outdoor (numeric ids) + 32 indoor (ids `i01`–`i32`),
  including a Greenhouse / Hydroponics tag category.
- **Stack:** React 18 (UMD, via unpkg) + `@babel/standalone@7.29.7`
  (pinned — `latest` resolves to Babel v8, which breaks JSX in non-module
  `<script>` tags), no build tooling, no bundler.
- **Source:** `src/catalogue.jsx` — data section (plant objects, photo
  base64/URLs, wiki slugs) followed by components (helpers, PhotoCard,
  PlantCard, OutdoorCard, IndoorCard, DetailPanel, Catalogue).
- **Built output:** `index.html` — the JSX with the `import` line swapped
  for `const { ... } = React;`, `export default` stripped, wrapped in an
  HTML shell with the React/Babel CDN `<script>` tags.
- **PWA:** `manifest.json`, `icon-192.png`, `icon-512.png`, `sw.js` (service
  worker registered from `index.html` on load) make the app installable and
  usable offline.
- **Hosting:** Netlify, at martyshaven.netlify.app.

## Features live
- Card flip (front = photo/tags, back = care snapshot + watering button)
- Care tracker with localStorage (green/amber/red urgency dot per plant)
- Seasonal "In Season" detection + pulsing glow on flowering plants
- Sticky search bar + tag chip filtering
- Full detail modal overlay (Escape to dismiss)
- Parallax cover image on scroll
- Greenhouse / Hydroponics category (distinct tag, alongside Outdoor/Indoor)

## Plant data schema (outdoor)
`{id, n, name, latin, family, origin, type, light, water, humidity, temp,
height, flowering, flower, hardiness, toxic, difficulty, desc, soil, care,
tags}` — indoor entries follow the same shape with string ids (`i01`, …).

## Adding new plants — workflow
1. Identify plant species.
2. Fetch a reference image if needed (e.g. Wikipedia REST summary API).
3. Add a plant object to the outdoor or indoor array in `src/catalogue.jsx`
   (next numeric id after 56 for outdoor, next `iNN` for indoor).
4. Tag appropriately (include `Greenhouse`/`Hydroponics` tags if relevant).
5. Rebuild `index.html` per the README's Updating section.
6. Commit both `src/catalogue.jsx` and the rebuilt `index.html` together.
7. Deploy to Netlify.

## History note
An earlier, separate build of this catalogue existed as a self-contained
vanilla HTML/CSS/JS file (no React, no CDN deps, embedded base64 JPEGs,
batch-numbered plants, Python PIL image pipeline) — that lineage topped out
at 34 plants and was superseded by this React/PWA version, which is now the
actively maintained one. The vanilla version is not preserved in this repo's
history beyond the initial commits; it lived in a separate local tarball.

## How to Resume This Project in a New Chat
Paste this file's contents (or point Claude at this repo) and describe what
you want changed — new plants to add, features to build, or bugs to fix.
