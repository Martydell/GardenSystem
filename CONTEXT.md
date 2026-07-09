# Garden Plant Catalogue — Project Context

## Purpose
Marty is building a comprehensive personal plant catalogue — a self-contained HTML
file viewable in any browser, featuring his own photos of each plant (supplemented
by stock images where personal photos are unclear). Goal: a portable, searchable
reference for his plant collection.

**Working philosophy:** build with best available info, flag uncertainties
visibly, refine as corrections come in across batches. "Build now, correct later."

## Current State (as of last session)

- **34 plants catalogued** across 2 photo batches, deduplicated
- Output: single self-contained HTML file `index.html` — photos embedded as
  base64 JPEGs (900x900 max, quality 82), live search, category filter, batch
  filter, no external dependencies
- Batch 1 identifications were largely inaccurate on first pass; corrected
  after user feedback. Batch 2 identifications were more reliable on first pass.

### Confirmed corrections (Batch 1)
| Image | Was labeled | Correct ID |
|---|---|---|
| img 4 | — | Spider Plant (*Chlorophytum comosum*) |
| img 5 | Citrus (unspecified) | Lemon Tree (*Citrus × limon*) |
| img 6 | — | Calla Lily (*Zantedeschia aethiopica*) |
| img 12 | Hoya | Peperomia sp. |
| img 17 | Spider Plant | Dracaena (variety unconfirmed) |

### Still flagged ⚠ unconfirmed (Batch 1)
1. **"Clusia" card** — oval-leaf plant grown in LECA (clay pebbles). User has
   NOT yet confirmed correct ID. Do not trust the "Clusia rosea" label if it
   reappears — it was one of the wrong guesses.
2. **"Croton" card** — tall, dark glossy-leaved plant with a braided trunk.
   User has NOT confirmed correct ID.
3. **"Dracaena (variety to confirm)" card** — green bubble-pot plant, confirmed
   family (Dracaena) but not variety.

**Important:** Almost all of Batch 1's original identifications were called
wrong by the user in a general sense ("Almost all [are wrong]"), but only the
five specific corrections above were explicitly given. Treat all Batch 1 IDs
not in the confirmed-corrections table with caution — they are the *original
AI guesses*, not verified facts, except where marked ✓ confirmed through
follow-up conversation (Phalaenopsis orchid, Fiddle Leaf Fig, Canna Lily,
Alocasia 'Black Velvet', Dracaena fragrans, Dracaena marginata, Pachira
aquatica/Money Tree, Calathea rufibarba, Peace Lily/Spathiphyllum — these were
implicitly accepted when the user only corrected five specific items and said
build/move on).

### Batch 2 (17 plants, more reliable IDs, not yet challenged by user)
Aloe (aristata/hybrid), Echeveria, Dendrobium orchid, Heartleaf Philodendron,
Monstera deliciosa (juvenile), Philodendron 'Dark Lord', Phalaenopsis (dormant
— second specimen), Vanilla planifolia, ZZ Plant, Ming Aralia (Polyscias
fruticosa), Calathea/Goeppertia (large, species unconfirmed), Pothos
(Epipremnum aureum), trailing Pilea (species unconfirmed), Tradescantia
zebrina, Elephant Ear Alocasia, Common Ivy (Hedera helix), Monstera deliciosa
(mature).

Duplicates already removed in Batch 2: 3 shots of the same Heartleaf
Philodendron, 2 shots of the same Aloe.

## Catalogue Structure (each plant card includes)
- Common name, Latin name, Family
- Origin
- Classification chips (Edible / Medicinal / Ornamental / Air-purifying /
  Toxic / Pet-safe) — color-coded
- Care instructions
- Propagation methods
- Hardiness (UK-context, since user is in England)
- Sowing time
- Flowering time
- Time to full maturity
- Batch badge (Batch 1 = green, Batch 2 = purple)
- ⚠ Warning note box for unconfirmed IDs or toxicity notes

## Technical Details
- **Output file:** `index.html` (single file, ~3.8MB due to embedded photos)
- **Image processing:** Python PIL — EXIF-transposed, resized to max 900×900,
  JPEG quality 82, base64-encoded inline (`data:image/jpeg;base64,...`)
- **Intermediary JSON stores used during build:** `img_b64.json` (batch 1),
  `img_b64_all.json` (combined) — these lived in the Claude working directory,
  not delivered to the user; regenerate from source photos if rebuilding.
- **Frontend:** vanilla HTML/CSS/JS, no build step, no external CDN
  dependencies — fully offline-capable. Live search filters by text match
  across the whole card; two `<select>` dropdowns filter by category chip and
  by batch.
- **Deduplication approach:** when multiple photos of the same physical plant
  arrived in the same upload batch, one representative photo was chosen and
  the others discarded (not shown in catalogue).

## User Preferences / Communication Style
- Wants brief, action-oriented exchanges — minimal back-and-forth
- Prefers "build now, correct later" over waiting for full verification
- Corrections should be treated as authoritative and applied immediately
- Iterative pattern: process a batch → append to existing photo store →
  rebuild the single HTML output → present it

## Next Steps / Open Items
1. Get user's ID for the 3 remaining ⚠ unconfirmed plants (see table above)
2. Continue accepting new photo batches, deduplicating, appending to the
   same catalogue
3. Consider splitting `index.html` into `index.html` + `style.css` +
   `script.js` + `data/plants.js` for easier hand-editing (discussed but not
   yet done — user asked about moving to VS Code instead)
4. User wants this project on GitHub for version control / pulling into
   VS Code — repo setup instructions provided separately since Claude cannot
   authenticate to GitHub on the user's behalf

## How to Resume This Project in a New Chat
Paste this file's contents (or attach it) and say: "Continue my garden
catalogue project — see attached context." Then upload the next batch of
photos as usual.
