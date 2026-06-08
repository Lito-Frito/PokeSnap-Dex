[![pages-build-deployment](https://github.com/Lito-Frito/PokeSnap-Dex/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/Lito-Frito/PokeSnap-Dex/actions/workflows/pages/pages-build-deployment)

# PokeSnap-Dex

Gotta snap 'em all! A simple, static Pokédex for displaying your Pokémon photos.

## Features

- Browse all 1025 Pokémon (Gen 1–9) in a responsive grid
- Gallery modal with variant navigation (regular, shiny, regional, mega forms)
- Pokédex entry text fetched from [PokeAPI](https://pokeapi.co/) — grouped by game entries that share identical text
- Keyboard shortcuts for fast navigation (see below)
- Dark/light theme toggle
- Capture count tracking

## Search Syntax

- Search is not case-sensitive.
- Use commas to search multiple entries: `Pikachu, Gastly`.
- Search `Shiny` alone to show all captured shiny variants.
- Search `Shiny <Pokemon>` to return that specific shiny variant.
- Use `Shiny &` or `Shiny and` to request shinies for all listed Pokémon: `Shiny & Pikachu, Gastly, Combee`.
- Mix shiny and regular results with commas: `Shiny Pikachu, Meowth` returns shiny Pikachu and regular Meowth.

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
   - Edit `data.json` with your photos (see below).
   - Commit and push changes: `git add . && git commit -m "Update photos" && git push`.

## How to Add Your Photos

To populate your PokeSnap-Dex with images, follow these steps:

1. **Host Your Images Online**:
   - Upload your photos to a free image hosting service like [Imgur](https://imgur.com/), [GitHub](https://github.com/) (in a repo), or any public URL provider.
   - Ensure the images are publicly accessible (no login required).

2. **Edit the Data File**:
   - Open `data.json` in a text editor.
   - Add entries for each Pokémon you want to include. Use the 3-digit number as the key (e.g., "001" for Bulbasaur).

#### Simple Example (Minimum Required)
Start with just the essential fields:
```json
"001": {
  "name": "Bulbasaur",
  "variants": [
    { "image": "https://imgur.com/your-image-url.jpg", "label": "Bulbasaur" }
  ]
}
```
That's it! The app handles the rest with sensible defaults.

#### Understanding Variants
**"Variants" are different forms of the same Pokémon**, like:
- **Shiny** versions (different color)
- **Mega** forms (Mega Charizard X, Mega Charizard Y)
- **Regional** variants (Alolan Pikachu, Galarian Weezing)
- **Other forms** (Totem, Gmax, Tera)

You can add multiple variants to show different captures. Always put the regular form first.

#### Advanced Example (With Variants and Positioning)
Here's a more complete entry using optional fields:
```json
"006": {
  "name": "Charizard",
  "variants": [
    { "image": "https://imgur.com/charizard.jpg", "label": "Charizard", "fit": "cover", "position": "center" },
    { "image": "https://imgur.com/mega-charizard-x.jpg", "label": "Mega Charizard X", "fit": "cover", "position": "left" },
    { "image": "https://imgur.com/shiny-charizard.jpg", "label": "Shiny Charizard", "fit": "contain" }
  ]
}
```

3. **Save and Refresh**:
   - Save `data.json`.
   - Refresh your browser (if running locally) or redeploy (if hosted online).
   - Your new entries will appear in the grid. Click them to view variants in the gallery.

## Data Structure Reference

This section explains all fields in `data.json` entries. **Fields marked Required are necessary; all others are optional.**

| Field | Required | Type | Description | Default |
|-------|----------|------|-------------|---------|
| `name` | ✅ Yes | string | Official Pokémon name | — |
| `variants` | ✅ Yes | array | Array of image objects | — |
| `variants[].image` | ✅ Yes | string | Direct URL to the image | — |
| `variants[].label` | ✅ Yes | string | Display name in gallery (e.g., "Shiny Charizard", "Mega Charizard X") | — |
| `variants[].fit` | No | string | How to scale image in thumbnail: `"contain"` or `"cover"` | `"contain"` |
| `variants[].position` | No | string | Which part to show if cropped: `"center"`, `"left"`, `"right"`, `"top"`, `"bottom"` | `"center"` |
| `genus` | No | string | Pokémon genus (e.g., "Seed Pokémon") | Auto-populated by sync script |

**Note:** The `genus` field is automatically populated by `scripts/sync-dex-entries.js` from PokeAPI. You don't need to add it manually.

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
| `Ctrl+←` / `Ctrl+→` | Jump to previous / next Pokémon in the dex |
| `↑` / `↓` | Scroll through Pokédex entries |
| `Escape` | Close the gallery |

## Pokédex Entries

Entry text is sourced from [PokeAPI](https://pokeapi.co/) via `scripts/sync-dex-entries.js` and stored in `data-entries.json`. Entries are grouped so that games with identical text are shown together (e.g. `Red/FireRed`, `(Heart)Gold`, `Diamond/Pearl/Platinum`). This keeps the entry list readable without losing source attribution.

## Understanding Key Features

### Captured Count
The **"Captured: X"** count shows how many Pokémon have **at least one real image**. Placeholder images (`"https://your-image-url-here.jpg"`) don't count—only real image URLs are considered "captured."

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
