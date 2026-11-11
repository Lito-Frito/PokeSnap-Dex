# Branch Notes for PokeSnap-Dex

## Branch Overview
- **main**: Public dataset, identified by `pokesnap-dex-main`. `data.json` references IDs in `images.json`.
- **LitoFrito**: Personal dataset with real images, identified by `pokesnap-dex-litofrito`. Its data and image registry must be migrated independently.

## Git Remote
- Use the repository's configured remote when fetching or pushing. Check its name with `git remote -v` rather than assuming it is `GitHub` or `origin`.

## Merge Guidelines
- **Do not merge `data.json` or `images.json` from `main` into `LitoFrito`**: Image IDs and URLs belong to different datasets.
- When propagating code or docs, preserve each branch's `data.json`, `images.json`, `collections.json`, and branch-specific `data-entries.json`.
- Preserve `LitoFrito`'s `data.json` and `images.json` to retain the personal photo data and branch-specific image IDs.
- `main` and `LitoFrito` should remain synchronized on code changes, while keeping their data files and image registries independent.
- `data.json`, `images.json`, `collections.json`, and branch-specific `data-entries.json` may intentionally differ. Image IDs are not interchangeable between datasets.
- Migrate LitoFrito from its own checkout with `node scripts/migrate-image-ids.js --dataset-id pokesnap-dex-litofrito`; do not run that command against a `main` checkout.
- Before migration, the script makes exact backups under `.data-backups/<datasetId>/`. This path is gitignored; copy backups off-device. Never overwrite a non-identical backup.
- Add future images using `node scripts/add-image.js --number <dex-number> --label "<exact variant label>" --url "<https URL>"`; commit `data.json` and `images.json` together.

## Issue / Feature Workflow
- Read the issue and explain it before implementing anything.
- Propose the fix and wait for approval.
- Create a new branch from `main` with a name like `Issue{number}-{Issue_Title_With_Underscores}`.
- Implement the fix and test locally.
- Merge the branch into `main`.
- Propagate the same code fix to `LitoFrito` without overwriting its branch-specific data files or image registry.
- Delete the feature branch locally and remotely once merged.
- Never delete `main` or `LitoFrito` without explicit approval.

## Branch Naming Conventions
- Feature branches should match the issues they fix or close.
- Delete feature/issue branches after the fix is merged or no longer needed.
- Never delete `main` or `LitoFrito` without explicit approval.
- Format: `Issue{number}-{Issue_Title_With_Underscores}`
- Example: For issue #100 titled "Fix Thing", use branch name `Issue100-Fix_Thing`
- Use this for new features, bug fixes, or enhancements tied to specific issues.
