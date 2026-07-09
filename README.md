# 🌿 Marty's Plant Haven

A personal plant catalogue, care tracker & garden map — 83 plants (51
outdoor, 32 indoor, including greenhouse/hydroponics) with photos, origin,
care instructions, propagation methods, hardiness, classification,
sowing/flowering times, and time to maturity for each plant.

Live at [martyshaven.netlify.app](https://martyshaven.netlify.app/).

## Structure
- `index.html` — the built, deployable app (this is what Netlify serves).
  React 18 (UMD) + Babel standalone, no build step required to run it.
- `src/catalogue.jsx` — the editable JSX source. Edit this, then rebuild
  `index.html` (see below).
- `manifest.json`, `icon-192.png`, `icon-512.png`, `sw.js` — PWA
  manifest, icons, and service worker (installable, offline-capable).

## Usage
Open `index.html` in any browser, or visit the live Netlify deployment.
Installable as a PWA on mobile/desktop.

Features:
- Card flip (front = photo/tags, back = care snapshot + watering button)
- Care tracker with localStorage (green/amber/red urgency dot per plant)
- Seasonal "In Season" detection + pulsing glow on flowering plants
- Sticky search bar + tag chip filtering
- Full detail modal overlay
- Greenhouse / hydroponics category alongside outdoor and indoor

## Updating
1. Edit `src/catalogue.jsx` (data section at the top, components below).
2. Rebuild `index.html`: replace the JSX's `import { ... } from "react"`
   line with `const { ... } = React;`, strip `export default`, and wrap in
   the HTML shell (see `index.html` head/script tags) with the pinned
   `@babel/standalone@7.29.7` CDN script (do not use `latest` — v8 breaks
   JSX in non-module script tags).
3. Deploy: push to `main`, Netlify auto-deploys from this repo (if
   connected), or drag-and-drop `index.html` + PWA assets into Netlify.

See [`CONTEXT.md`](./CONTEXT.md) for full project history and open items.
