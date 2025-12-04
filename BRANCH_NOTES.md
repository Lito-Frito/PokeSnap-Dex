# Branch Notes for PokeSnap-Dex

## Branch Overview
- **main**: Public branch with placeholder data in `data.json` for demo purposes.
- **LitoFrito**: Personal branch with real image data in `data.json`.

## Merge Guidelines
- **Do not merge `data.json` from `main` into `LitoFrito`**: This would overwrite real images with placeholders.
- When applying UI changes from `main` to `LitoFrito`, use cherry-pick or manual edits to avoid `data.json` conflicts.
- Always keep `LitoFrito`'s `data.json` intact to preserve personal photo data.

## Recent Changes
- UI enhancements (colors, spacing, mobile responsiveness) applied selectively to `LitoFrito` via cherry-pick.
- Gallery positioning reverted in `LitoFrito` to maintain functionality.