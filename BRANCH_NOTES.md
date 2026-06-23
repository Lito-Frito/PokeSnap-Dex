# Branch Notes for PokeSnap-Dex

## Branch Overview
- **main**: Public branch with placeholder data in `data.json` for demo purposes.
- **LitoFrito**: Personal branch with real image data in `data.json`.

## Git Remote
- The remote repository is named `GitHub` (not `origin`). Use `git push GitHub LitoFrito` to push changes to the LitoFrito branch.

## Merge Guidelines
- **Do not merge `data.json` from `main` into `LitoFrito`**: This would overwrite real images with placeholders.
- When applying UI or docs changes from `main` to `LitoFrito`, use cherry-pick or manual edits to avoid `data.json` conflicts.
- Always keep `LitoFrito`'s `data.json` intact to preserve personal photo data.
- `main` and `LitoFrito` should remain synchronized on all issue fixes and feature work outside of real image URIs.

## Issue / Feature Workflow
- Read the issue and explain it before implementing anything.
- Propose the fix and wait for approval.
- Create a new branch from `main` with a name like `Issue{number}-{Issue_Title_With_Underscores}`.
- Implement the fix and test locally.
- Merge the branch into `main`.
- Propagate the same fix to `LitoFrito` without overwriting real `data.json` image URLs.
- Delete the feature branch locally and remotely once merged.
- Never delete `main` or `LitoFrito` without explicit approval.

## Branch Naming Conventions
- Feature branches should match the issues they fix or close.
- Format: `Issue{number}-{Issue_Title_With_Underscores}`
- Example: For issue #100 titled "Fix Thing", use branch name `Issue100-Fix_Thing`
- Use this for new features, bug fixes, or enhancements tied to specific issues.
