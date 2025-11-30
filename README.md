# PokeSnap-Dex

Gotta snap 'em all! A simple, static Pokédex for displaying your Pokémon photos.

## Quick Start

### Option 1: Host Locally (Easiest for Testing)

1. **Clone or Download the Repository**:
   - If you have Git: `git clone https://github.com/yourusername/PokeSnap-Dex.git` (replace with your repo URL)
   - Or download the ZIP from GitHub and extract it.

2. **Open in a Browser**:
   - Navigate to the project folder in your terminal.
   - Run: `python3 -m http.server 8000` (or use any simple HTTP server).
   - Open `http://localhost:8000` in your browser.

### Option 2: Host Online (Free with GitHub Pages)

1. **Fork and Clone**:
   - Fork the repository on GitHub.
   - Clone your fork: `git clone https://github.com/yourusername/PokeSnap-Dex.git`

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Settings > Pages > Source: "Deploy from a branch" > Branch: "main" > Save.
   - Your site will be available at `https://yourusername.github.io/PokeSnap-Dex/`.

3. **Customize and Push**:
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
   - Format each entry like this:
     ```json
     "001": {
       "name": "Bulbasaur",
       "variants": [
         { "image": "https://imgur.com/your-image-url.jpg", "label": "Regular", "position": "center", "fit": "cover" }
       ]
     }
     ```
   - For multiple variants (e.g., Shiny or Regional forms), add more objects to the `variants` array:
     ```json
     "025": {
       "name": "Pikachu",
       "variants": [
         { "image": "https://imgur.com/pikachu-regular.jpg", "label": "Regular", "position": "center", "fit": "cover" },
         { "image": "https://imgur.com/pikachu-galarian.jpg", "label": "Galarian", "position": "left", "fit": "cover" }
       ]
     }
     ```

3. **Save and Refresh**:
   - Save `data.json`.
   - Refresh your browser (if running locally) or redeploy (if hosted online).
   - Your new entries will appear in the grid. Click them to view variants in the gallery.

## Thumbnail Positioning and Fit

To control how the image is cropped and fitted in the square thumbnail, add `"position"` and `"fit"` fields to each variant.

- **Position**: Adjusts the focus area (`"center"`, `"top"`, `"bottom"`, `"left"`, `"right"`).
- **Fit**: 
  - `"contain"` (default): Scales to fit entirely, with black negative space (zoomed-out like Instagram).
  - `"cover"`: Crops to fill the square, showing more image.

**Example**: For a portrait AR photo, use `"fit": "cover"` to crop and fill the square.

Both settings apply to thumbnails and gallery views.

## Tips
- **Naming**: Use the official 3-digit Pokémon number (001-1025).
- **Variants**: The first variant in the array is shown as the thumbnail. Use the gallery to cycle through others.
- **Performance**: With 1000+ entries, the page may load slowly—consider lazy-loading images if needed.
- **Hosting**: For free hosting, push this to GitHub and enable GitHub Pages.

## Example
See the included `data.json` for sample entries.

## Troubleshooting
- If images don't load, ensure URLs are public and correct.
- For GitHub Pages, changes may take a few minutes to deploy.
- No server setup required—this is fully static HTML/CSS/JS.

## License

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
