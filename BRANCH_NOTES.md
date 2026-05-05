# Branch Notes for PokeSnap-Dex

## Branch Overview
- **main**: Public branch with placeholder data in `data.json` for demo purposes.
- **LitoFrito**: Personal branch with real image data in `data.json`.

## Git Remote
- The remote repository is named `GitHub` (not `origin`). Use `git push GitHub LitoFrito` to push changes to the LitoFrito branch.

## Merge Guidelines
- **Do not merge `data.json` from `main` into `LitoFrito`**: This would overwrite real images with placeholders.
- When applying UI changes from `main` to `LitoFrito`, use cherry-pick or manual edits to avoid `data.json` conflicts.
- Always keep `LitoFrito`'s `data.json` intact to preserve personal photo data.

## Branch Naming Conventions
- Feature branches should match the issues they fix or close.
- Format: `Issue{number}-{Issue_Title_With_Underscores}`
- Example: For issue #100 titled "Fix Thing", use branch name `Issue100-Fix_Thing`
- Use this for new features, bug fixes, or enhancements tied to specific issues.
