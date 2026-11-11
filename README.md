[![pages-build-deployment](https://github.com/Lito-Frito/PokeSnap-Dex/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/Lito-Frito/PokeSnap-Dex/actions/workflows/pages/pages-build-deployment)

# PokeSnap-Dex

Gotta snap 'em all! A simple, static Pokédex for displaying your Pokémon photos.

## Features

- Browse all 1025 Pokémon (Gen 1–9) in a responsive grid
- Gallery modal with variant navigation and previous/next Pokémon controls (regular, shiny, regional, mega forms)
- Previous/next Pokémon controls follow the current search and capture-status filters
- Play cached Pokémon cries for standard and Mega forms, with latest/legacy recordings when available
- Pokédex entry text fetched from [PokeAPI](https://pokeapi.co/) — grouped by game entries that share identical text
- Keyboard shortcuts for fast navigation (see below)
- Dark/light theme toggle
- Capture count tracking
- Stable image IDs, so changing carousel order or moving image hosting does not break collection references
- Read-only published collections and a collection builder that previews and exports JSON for the site owner

## Search Syntax

- Search is not case-sensitive.
- Use commas to search multiple entries: `Pikachu, Gastly`.
- Search `Shiny` alone to show all captured shiny variants.
- Search `Shiny <Pokemon>` to return that specific shiny variant.
- Use `Shiny &` or `Shiny and` to request shinies for all listed Pokémon: `Shiny & Pikachu, Gastly, Combee`.
- Mix shiny and regular results with commas: `Shiny Pikachu, Meowth` returns shiny Pikachu and regular Meowth.

## Collections

Select **Collections** to browse the published collections one at a time with **Prev Collection / Next Collection**, or start building one. Set the grid size (1–5 rows and 1–5 columns), click a cell, search for a Pokémon in the usual search bar, and select a result. The image picker opens in carousel mode; use **Prev Image / Next Image**, **Select Image / Remove Image**, and **Close**. Empty cells appear black. Your in-progress draft is saved in this browser and can be resumed after closing or reloading the page; **Cancel** discards it. Add an optional description or audio URL (direct audio, a Spotify track link, or a SoundCloud link), then preview the grid and download `collections.json`.

The site does not save visitor-created collections or change its published catalog. To publish a collection, the site owner reviews the downloaded JSON and commits it to the repository. Collections refer to image IDs, not URLs or list positions. Direct audio files use browser controls; Spotify and SoundCloud links use their provider players. Playback is never started automatically, and provider playback may depend on the visitor's account, region, or the track's availability.

## Data schema version 2

Image identity is separate from image hosting:

- `data.json` keeps each Pokémon and its variants. `variants[].images` contains stable image IDs in carousel order.
- `images.json` maps each ID to its current URL. Keep an ID when moving an image or changing its URL; assign a new ID only for a different image.
- `collections.json` stores collection name, optional description/audio URL, grid dimensions (`x` rows by `y` columns), and row-major `cells`. Use `"blank"` for an empty cell. Both dimensions must be 1–5.

The files are linked by `_meta.datasetId`; each branch has its own image dataset. The app checks that image references resolve and reports incompatible/missing data instead of silently selecting another image.

### Pokémon Cries

The gallery loads cry recordings from PokeAPI for the currently selected Pokémon form. Standard and Mega forms use their own PokeAPI cry when available. When both are available, press and hold **Play Cry**, then drag to **Latest** or **Legacy** and release to play that recording. PokeAPI does not provide a separate recording for every game generation. Repeated Pokémon API lookups are cached in memory and by the browser's HTTP cache. Uncaptured Pokémon remain locked until **Show Spoilers** is enabled.

## Quick Start

### Option 1: Host Locally (Easiest for Testing)

1. **Clone or Download the Repository**:
   - If you have Git: `git clone https://github.com/yourusername/PokeSnap-Dex.git` (replace with your repo URL)
   - Or download the ZIP from GitHub and extract it.

2. **Generate Pokédex Entry Data** (requires Node.js and internet access):
   ```bash
   node scripts/sync-dex-entries.js
   ```
   This fetches all Pokédex entries from PokeAPI and writes `data-entries.json`. Takes ~2–3 minutes. Only needed once (or when you want updated data).

3. **Open in a Browser**:
   - Navigate to the project folder in your terminal.
   - Run: `python3 -m http.server 8000` (or use any simple HTTP server).
   - Open `http://localhost:8000` in your browser.

### Option 2: Host Online (Free with GitHub Pages)

1. **Fork and Clone**:
   - Fork the repository on GitHub.
   - Clone your fork: `git clone https://github.com/yourusername/PokeSnap-Dex.git`

2. **Generate Pokédex Entry Data**:
   ```bash
   node scripts/sync-dex-entries.js
   ```
   Commit the resulting `data-entries.json` to your repo.

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Settings > Pages > Source: "Deploy from a branch" > Branch: "main" > Save.
   - Your site will be available at `https://yourusername.github.io/PokeSnap-Dex/`.

4. **Customize and Push**:
   - Add photos using the helper command below; do not put image URLs directly in `data.json`.
   - Commit and push changes: `git add . && git commit -m "Update photos" && git push`.

## How to Add a Photo

1. Host the photo at a publicly accessible HTTPS URL.
2. Find the Pokémon number and exact variant label already used by the Dex. For example, Bulbasaur is `001`, and its regular label is `Bulbasaur`.
3. From the repository root, run:

   ```bash
   node scripts/add-image.js --number 001 --label "Bulbasaur" --url "https://example.com/bulbasaur.png"
   ```

   Optional: add `--first-encountered "Scarlet"` (or another game/source name) to record where the image was first encountered. The helper adds an opaque UUID to `images.json` and appends that ID to the chosen variant in `data.json`. It reuses an existing ID if the exact URL is already registered. Keep the ID unchanged if you later update the URL.

4. Run `node test.js`, review both changed data files, and commit them together.

To migrate an older dataset, `node scripts/migrate-image-ids.js` creates stable IDs for the current `data.json` and writes `images.json`. It first saves the original data and registry under `.data-backups/pokesnap-dex-main/`; that directory is gitignored. Copy the backup somewhere safe off-device. The migration is safe to rerun and keeps IDs from the matching dataset.

For the separate LitoFrito image dataset, run the migration on that branch's own checkout using `node scripts/migrate-image-ids.js --dataset-id pokesnap-dex-litofrito`. Never copy `main`'s migrated `data.json` or `images.json` over LitoFrito; the images differ. Each branch gets its own ignored pre-migration backup.

## Data Structure Reference

This section explains the migrated fields in `data.json`. **Fields marked Required are necessary; all others are optional.**

| Field | Required | Type | Description | Default |
|-------|----------|------|-------------|---------|
| `name` | ✅ Yes | string | Official Pokémon name | — |
| `variants` | ✅ Yes | array | Array of image objects | — |
| `variants[].images` | ✅ Yes | array of strings | Stable image IDs in carousel order; each ID must exist in `images.json` | — |
| `variants[].label` | ✅ Yes | string | Display name in gallery (e.g., "Shiny Charizard", "Mega Charizard X") | — |
| `variants[].fit` | No | string | How to scale image in thumbnail: `"contain"` or `"cover"` | `"contain"` |
| `variants[].position` | No | string | Which part to show if cropped: `"center"`, `"left"`, `"right"`, `"top"`, `"bottom"` | `"center"` |
| `genus` | No | string | Pokémon genus (e.g., "Seed Pokémon") | Auto-populated by sync script |

**Note:** The `genus` field is automatically populated by `scripts/sync-dex-entries.js` from PokeAPI. Image IDs are mapped to URLs through `images.json`.

## Thumbnail Positioning and Fit

The optional `"position"` and `"fit"` fields control how images appear in **grid thumbnails only** (not in the full-scale gallery view). Use these to intelligently crop non-square images into square thumbnails.

### How They Work Together

- **`fit` answers:** *"How do I get the image to fill/fit the container?"*
- **`position` answers:** *"If the image gets cropped, which part do I keep?"*

`position` only matters when cropping happens (which requires `fit: "cover"`).

### The `fit` Property

Controls the scaling strategy for fitting an image into a 192×192px square thumbnail.

| Option | Behavior | Result |
|--------|----------|--------|
| **`contain`** (default) | Scale to fit entirely inside the square; add letterbox if needed | Full image visible with black padding if aspect ratio doesn't match |
| **`cover`** | Scale to completely fill the square; crop what doesn't fit | Image fills square but edges may be cropped—use `position` to control which edges |

### The `position` Property

Controls which part of the image stays visible when `fit: "cover"` causes cropping. Ignored when using `fit: "contain"`.

| Option | Crops From | Keeps Visible | Use Case |
|--------|-----------|---|---|
| **`center`** (default) | All sides equally | Middle of image | Centered subjects or landscapes |
| **`left`** | Right side | Left side | Subject on the left (e.g., profiles) |
| **`right`** | Left side | Right side | Subject on the right |
| **`top`** | Bottom | Top | Subject at top (e.g., heads in portraits) |
| **`bottom`** | Top | Bottom | Subject at bottom |

### Examples

#### Example 1: Portrait AR Photo (Tall)
```json
{
  "image": "https://imgur.com/portrait.jpg",
  "label": "Character - Portrait",
  "fit": "cover",
  "position": "top"
}
```
**Result:** Focuses on the top of the portrait (head area), crops the bottom.

#### Example 2: Landscape AR Photo (Wide)
```json
{
  "image": "https://imgur.com/landscape.jpg",
  "label": "Location - Landscape",
  "fit": "cover",
  "position": "left"
}
```
**Result:** Focuses on the left side of the landscape, crops the right.

#### Example 3: Square Image (No Cropping Needed)
```json
{
  "image": "https://imgur.com/square.jpg",
  "label": "My Snap",
  "fit": "contain"
}
```
**Result:** Full image always visible; `position` is ignored since there's no cropping.

### Gallery View Behavior

When you click a thumbnail to open the gallery, images always display with `fit: "contain"` (full image visible). The `position` and `fit` settings only affect the **small grid thumbnails**, not the full-scale gallery view.

## Keyboard Shortcuts

When the gallery is open:

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / next image for this Pokémon |
| `Ctrl+←` / `Ctrl+→` (or `Cmd` on macOS) | Jump to previous / next Pokémon in the dex |
| `↑` / `↓` | Scroll through Pokédex entries |
| `Escape` | Close the gallery |

## Pokédex Entries

Entry text is sourced from [PokeAPI](https://pokeapi.co/) via `scripts/sync-dex-entries.js` and stored in `data-entries.json`. Entries are grouped so that games with identical text are shown together (e.g. `Red/FireRed`, `(Heart)Gold`, `Diamond/Pearl/Platinum`). This keeps the entry list readable without losing source attribution.

### Audit Mega Forms

Run `node scripts/check-mega-coverage.js` to compare Mega forms listed by PokeAPI with the Mega labels in `data.json` and form-specific entries in `data-entries-overrides.json`. The report is read-only and flags forms or labels that need review; it does not edit either data file.

PokeAPI provides species-level Pokédex text, not separate Mega-form flavor text. The app therefore falls back to the species entry when a Mega override is missing. Add form-specific text only after verifying it from a suitable source, then run `node test.js`. PokeAPI names and curated gallery labels can differ, so review unmatched items rather than renaming labels automatically.

#### If a New Mega Form Is Added to PokeAPI
New forms are not imported automatically. Run `node scripts/check-mega-coverage.js` to identify possible additions, then review the report before changing `data.json`. Confirm the correct species, display label, shiny variant, and any form-specific cry mapping; add images or placeholders and run `node test.js`. Only add an override when you have verified form-specific Pokédex text—otherwise the app uses the species-level entry. Rerun the audit after updating the data, and propagate the reviewed changes to both branches while preserving `LitoFrito`'s image URLs and `data-entries.json`.

## Understanding Key Features

### Captured Count
The **"Captured: X"** count shows how many Pokémon have **at least one real image**. The app resolves each image ID through `images.json`; placeholder URLs (`"https://your-image-url-here.jpg"`) don't count as captured.

### Gallery View
Click any Pokémon thumbnail to open the gallery. Use the navigation buttons or keyboard shortcuts to:
- View different variants (Shiny, Mega, regional forms, etc.)
- Read Pokédex entries for each Pokémon
- See which Pokédex games share the same entry text

## Tips
- **Naming**: Use the official 3-digit Pokémon number (001–1025).
- **Variants**: The first variant in the array is shown as the thumbnail. Regular form should always be first.
- **Positioning**: Only affects thumbnails in the grid. Gallery view always shows the full image.
- **Performance**: With 1000+ entries, the page may load slowly—consider lazy-loading images if needed.
- **Hosting**: For free hosting, push this to GitHub and enable GitHub Pages.
- **Updating entries**: Re-run `node scripts/sync-dex-entries.js` to refresh Pokédex text from PokeAPI.

## Example
See the included `data.json` for sample entries.

## Troubleshooting
- If images don't load, ensure URLs are public and correct.
- For GitHub Pages, changes may take a few minutes to deploy.
- No server setup required—this is fully static HTML/CSS/JS.

## License

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
