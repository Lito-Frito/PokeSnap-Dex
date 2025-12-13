# PokeSnap-Dex System Design Document

## 1. Overview
PokeSnap-Dex is a web-based Pokémon photo collection app inspired by Pokémon GO's AR photo feature. It displays a grid of 1,025 Pokémon (Gen 1-9) with variants (base, shiny, regional, etc.), allowing users to view captured Pokémon, browse galleries, and toggle themes. The app is vanilla (no frameworks), using HTML, CSS, and JavaScript for a responsive, sticky UI.

**Key Features:**
- Grid view: Shows the first available real image variant per Pokémon (skips placeholders).
- Capture count: Tracks only Pokémon with real images.
- Gallery: Modal view with keyboard navigation (arrows, escape).
- Responsive design: Adapts to mobile with dynamic grid sizing.
- Theme toggle: Light/dark mode.
- Sticky UI: Header sticks to top, footer to bottom, above the scrollable dex-container.

**Tech Stack:**
- **Frontend:** HTML5, CSS3, JavaScript (ES6+).
- **Data:** JSON (data.json for Pokémon entries).
- **Styling:** CSS with media queries, flexbox/grid, pseudo-elements.
- **Deployment:** Static files, served via Node.js (e.g., 'serve' package).

**Goals:** Simple, performant, and maintainable. No external dependencies beyond basic browser APIs.

## 2. Architecture
The app follows a single-page application (SPA) structure with modular components. It's not a full SPA (no routing), but uses modals for galleries.

### High-Level Structure
- **HTML (index.html):** Defines the DOM structure.
- **CSS (styles.css):** Handles layout, responsiveness, and theming.
- **JavaScript (script.js):** Manages state, events, and data rendering.
- **Data (data.json):** Static JSON for Pokémon data.

### File Breakdown
- **index.html:** Main HTML file. Includes meta tags, favicon, and structure for header, main content, and footer.
- **styles.css:** Comprehensive stylesheet with base styles, media queries, and component-specific rules.
- **script.js:** Handles DOM manipulation, event listeners, and data processing.
- **data.json:** Array of Pokémon objects with variants.
- **Other:** test.js (data integrity tests), LICENSE, README.md.

### Component Hierarchy
- **App Container (#app-container):** Wraps everything, provides max-width centering and padding.
- **Header:** Sticky top bar with title, controls (search, theme toggle, capture count).
- **Dex Container (#dex-container):** Scrollable grid of Pokémon cards.
- **Footer:** Fixed bottom bar (originally with divider).
- **Modals:** Gallery modal for viewing variants.

## 3. Key Components and Functionality

### 3.1 HTML Structure (index.html)
- **Head:** Standard meta tags, viewport for mobile, favicon link.
- **Body:** Contains #app-container.
  - **Header:** <header> with logo, controls (inputs, buttons).
  - **Main:** <main id="dex-container"> for the grid.
  - **Footer:** <footer> with potential divider.
- **Modals:** Hidden <div> for gallery, appended dynamically.

**Nuances:**
- No semantic roles beyond basic tags; relies on CSS for layout.
- Favicon and meta tags ensure proper mobile rendering.

### 3.2 CSS Styling (styles.css)
Styles are organized by component, with media queries for responsiveness.

#### Base Styles
- Body: Background #fafafa (light), #222 (dark). Font: Arial. Margin/padding: 0.
- #app-container: Max-width 668px, centered, padding 0 20px 20px 20px (bottom padding for footer space).

#### Header (.header-container)
- Position: sticky; top: 0; z-index: 1000.
- Background: #990000 (light), #000 (dark).
- Border-radius: 20px 20px 0 0.
- Controls: Flex layout, responsive font sizes.

#### Dex Container (#dex-container)
- Display: grid; grid-template-columns: repeat(auto-fit, minmax(192px, 1fr)).
- Height: calc(100vh - 120px) (accounts for header ~100px + footer 20px).
- Overflow-y: auto; background: #001a3d (dark blue).
- Padding: 20px; box-sizing: border-box.

**Nuances:**
- Grid auto-fits columns based on 192px min-width, ensuring responsiveness.
- Background color provides contrast; padding insets content.
- Media queries adjust padding, font sizes, and grid gaps.

#### Footer (.footer)
- Position: fixed; bottom: 0; z-index: 1000.
- Height: 20px; width: calc(100vw - 40px); max-width: 668px; centered.
- Uses pseudo-elements for styling:
  - ::before: White background, extends left/right (-20px) for full-width effect.
  - ::after: Red background (#990000), border-radius 0 0 20px 20px for rounded bottom.
- Dark mode: ::after background #000.

#### Footer Divider (.footer-divider)
- Position: fixed; bottom: 20px; height: 6px.
- Background: linear-gradient (gray to darker gray).
- Width/margin match footer.

#### Modals
- Position: fixed; full-screen overlay.
- Gallery: Flex layout for navigation.

#### Media Queries
- 1200px, 960px, 720px, 480px: Adjust header padding, control sizes, grid gaps.
- Landscape (max-width 768px): Adjust gallery height.

**Nuances:**
- Fixed positioning for header/footer ensures they stay in view.
- Pseudo-elements on footer create layered backgrounds without extra DOM.
- Z-index layering: Header/footer at 1000, modals higher.
- Responsive calc() heights can cause gaps on small screens if not adjusted (e.g., header height changes).

### 3.3 JavaScript Functionality (script.js)
Manages app state and interactions.

#### Key Functions
- **loadData():** Fetches data.json, processes entries.
- **renderGrid():** Builds grid from data, filters by search/theme.
- **handleCapture():** Toggles captured state, updates count.
- **openGallery():** Shows modal with variant images.
- **Keyboard Navigation:** Arrows for gallery, escape to close.

**Data Processing:**
- Filters placeholders (images starting with "https://your-image-url-here").
- Capture count: Counts entries with at least one real image.

**Nuances:**
- Uses findIndex() for first real variant.
- Event listeners on dynamic elements.
- No state management library; relies on DOM and variables.

### 3.4 Data Structure (data.json)
- Array of objects: { "001": { name: "Bulbasaur", variants: [{ label: "Base", image: "url" }] } }
- 1,025 entries, keyed by number.
- Variants: Base, shiny, regional, etc.
- Placeholders: "https://your-image-url-here.jpg" for missing images.

**Nuances:**
- Keys are strings (e.g., "001") for consistency.
- Images are URLs; app skips placeholders in display/count.

## 4. Data Flow and User Interactions
1. **Load:** script.js fetches data.json on DOMContentLoaded.
2. **Render:** Grid renders based on data, search input, theme.
3. **Interact:** Click Pokémon → open gallery; toggle theme/capture.
4. **Responsive:** Media queries adjust layout on resize.

## 5. Known Issues and Nuances
Based on troubleshooting:
- **White Gap on Mobile:** Appears at specific widths (e.g., >720px, 768-959px) due to calc() height mismatches with header/footer. Caused by padding, media query changes, or fixed positioning gaps. Removing padding-bottom from #app-container and adjusting heights helped, but not fully resolved.
- **Sticky Header Overlap:** Header covers dex-container top; no issue if content scrolls.
- **Rounded Corners Bleed:** Footer ::after border-radius can cause rendering issues on mobile; removing it fixes.
- **Divider Positioning:** Fixed divider can create gaps if not aligned with footer.
- **Performance:** Large grid (1025 items) may lag on low-end devices; optimize with virtualization if needed.
- **Browser Differences:** vh units vary (e.g., mobile Safari); test on target devices.
- **Accessibility:** No ARIA roles; add for screen readers.
- **Edge Cases:** Empty search, no images, theme toggle persistence.

## 6. Best Practices and Recommendations
- **Modularity:** Keep CSS organized by component; use variables for colors.
- **Testing:** Run test.js for data integrity; manual test on multiple devices.
- **Extensions:** Add localStorage for capture state; implement lazy loading for images.
- **Maintenance:** Update data.json for new Pokémon; monitor media query breakpoints.
- **Documentation:** Comment CSS/JS for clarity; this doc as reference.

This should give a future engineer a solid foundation. If you need expansions or corrections, let me know!