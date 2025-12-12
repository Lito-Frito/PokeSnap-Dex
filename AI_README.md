# AI README for PokeSnap-Dex

## Overview
PokeSnap-Dex is a web-based Pokémon photo collection app inspired by Pokémon GO's AR photo feature. It displays a grid of 1025 Pokémon (Gen 1-9 with variants) with thumbnails. Users can click thumbnails to open a gallery modal for viewing variants, search Pokémon, toggle themes, and see a capture count. The app uses vanilla HTML, CSS, and JavaScript with a JSON data file.

## UI Design Rules
- **Layering**: Header and footer are always on top of dex-container (z-index: 1000). Header and footer share the same layer.
- **Widths**: Header, footer, and dex-container have matching visual widths (100% of #app-container, with box-sizing: border-box for dex-container to include padding).
- **Sticky Elements**: Header sticks to top, footer sticks to bottom.
- **Responsive Height**: Dex-container uses `height: calc(100vh - 100px)` to fill available space, capping rows before footer.
- **Box-Sizing**: Dex-container uses `box-sizing: border-box` to ensure padding doesn't affect total width.

## File Structure
- **`index.html`**: Main HTML structure. Includes header with controls (search, theme toggle, captured count), main grid container (`#dex-container`), and modals (gallery, captured list).
- **`styles.css`**: CSS for layout (grid, flexbox), themes (dark/light), responsive design (mobile breakpoints), gallery modal styling, and animations.
- **`script.js`**: JavaScript logic for data loading, DOM manipulation, event handling, and UI updates.
- **`data.json`**: JSON file with Pokémon data (1025 entries, each with name and variants array).
- **`BRANCH_NOTES.md`**: Branch-specific guidance (e.g., don't merge `data.json` from `main` to `LitoFrito`).
- **`README.md`**: User-facing documentation (features, setup, etc.).
- **`test.js`**: Node.js script for data integrity checks (entry count, duplicates).

## Data Structure (`data.json`)
- **Format**: Object with keys `"001"` to `"1025"` (Pokémon numbers as strings).
- **Each Entry**:
  ```json
  {
    "name": "Bulbasaur",
    "variants": [
      {
        "image": "https://i.imgur.com/xxxxx.png",  // URL or placeholder
        "label": "Bulbasaur",  // Display name (e.g., "Shiny Bulbasaur")
        "position": "center",  // Image positioning (center, left, right, etc.)
        "fit": "contain"  // CSS object-fit (contain, cover)
      }
    ]
  }
  ```
- **Notes**: Placeholders are `"https://your-image-url-here.jpg"`. Thumbnails show the first non-placeholder variant. Gallery navigates all variants.

## Key Components and Logic

### HTML Structure
- **App Container**: `#app-container` wraps everything.
- **Header**: Sticky header with title, controls (search input, captured count button, theme toggle), and divider.
- **Dex Container**: `#dex-container` holds the Pokémon grid (CSS grid with auto-fit).
- **Gallery Modal**: `#gallery` (hidden by default) shows large image, name, and navigation buttons (prev/next/close).
- **Captured Modal**: `#captured-modal` for viewing captured Pokémon list.

### CSS Classes and Styling
- **Themes**: `.dark-mode` toggles dark/light styles (backgrounds, colors).
- **Grid**: `#dex-container` uses `grid-template-columns: repeat(auto-fit, minmax(192px, 1fr))` for responsive layout.
- **Gallery**: Fixed positioning (`position: fixed`) with `z-index: 2000` to overlay. Images sized at 50% width/height, with `object-fit` for cropping.
- **Responsive**: Media queries adjust header layout, button sizes, and grid min-width for mobile.
- **Entry States**: `.entry.empty` for missing images (black box with name).

### JavaScript Logic (`script.js`)

#### Initialization (`DOMContentLoaded`)
- Loads `data.json` via fetch.
- Calls `renderDex()` to populate grid.
- Sets up event listeners (search, theme toggle, gallery close, keyboard navigation).

#### Data Loading and Rendering
- **`renderDex()`**: Loops through `pokedexData`, creates `<div class="entry">` for each Pokémon. Sets thumbnail to first non-placeholder variant. Adds click handler to `openGallery(number)`.
- **Thumbnail Logic**: Finds first variant with real image URL. Sets `background-image` and `object-position` for cropping. If no image, shows name in black box.

#### Gallery Modal
- **`openGallery(number)`**: Sets current Pokémon, finds first real variant, updates image/name, shows modal. Scrolls container to top if needed.
- **`updateGalleryImage()`**: Updates image src, alt text, name, and styling (position, fit, background).
- **Navigation**: `prev-variant`/`next-variant` buttons cycle through variants. `close-gallery` hides modal.
- **Keyboard**: Arrow keys navigate variants, Escape closes.
- **Sizing**: Images use `width: 50%; height: 50%` (or `50vh` for positioned variants) to prevent upscaling.

#### Search and Filtering
- **`search-input`**: On input, filters entries by name (case-insensitive). Hides non-matching entries. For 1-2 results, switches to centered flex layout.

#### Theme Toggle
- **`theme-toggle`**: Toggles `dark-mode` class on `body`. Persists in localStorage.

#### Capture Count
- **`updateCapturedCount()`**: Counts Pokémon with at least one non-placeholder variant. Updates button text and enables captured modal.

#### Other Features
- **Captured Modal**: `captured-count` click shows list. `toggle-show-all` toggles showing all vs. captured.
- **Power Indicator**: Visual element in header (no functionality).
- **Responsive**: JS adjusts grid on window resize.

## Workflows
1. **Page Load**: Fetch data → Render grid → Set up listeners.
2. **Thumbnail Click**: Open gallery → Show first real variant → Allow navigation.
3. **Search**: Filter grid → Update layout for few results.
4. **Theme Change**: Toggle class → Update styles.
5. **Capture Check**: Count real images → Update UI.

## Branch Differences
- **`main`**: Public branch with placeholder images in `data.json`.
- **`LitoFrito`**: Personal branch with real Imgur URLs in `data.json`.
- See `BRANCH_NOTES.md` for merge rules (never merge `data.json` from `main` to `LitoFrito`).

## Common Tasks
- **Add Pokémon**: Update `data.json` with new entry (e.g., `"1026"`). Ensure 1025 total.
- **Update Images**: Replace URLs in `data.json`. Test locally.
- **Fix UI**: Modify CSS classes or JS functions. Test responsive design.
- **Test**: Run `node test.js` for data integrity. Serve locally with `serve -p 8000`.
- **Deploy**: Push to GitHub, enable Pages on `LitoFrito` branch.

## Notes for AI
- Use `fetch` for data loading (no libraries).
- Gallery uses DOM manipulation for modal (no frameworks).
- Positioning (`left`, `right`) crops images for variants (e.g., Gastly shares image).
- Avoid upscaling images in gallery to prevent pixelation.
- For changes, update both branches if UI-related, but keep `data.json` separate.