# PokeSnap-Dex Full-Stack Roadmap

## Purpose

This document describes how to evolve PokeSnap-Dex from the current V3 static product into V4, the first full-stack iteration.

This is an engineering roadmap. It intentionally does not cover monetization, pricing, or job-search strategy.

## Product Boundary

### V3: Current Product

V3 is the static, single-user dex experience:

- Vanilla HTML, CSS, and JavaScript.
- `data.json` contains the dex and image variant metadata.
- `data-entries.json` contains generated Pokédex text.
- GitHub Pages is the deployment target.
- There is no account system, server API, database, or user-owned cloud state.
- The `main` and `LitoFrito` branches share code changes while preserving their intentional data differences.

V3 should be completed and stable before introducing accounts or persistent user content.

### V4: First Full-Stack Iteration

V4 should add user-owned state while preserving the existing browsing experience:

1. A user can create an account and sign in.
2. A user can upload and manage their own Pokemon photos.
3. Photos are associated with dex species and optional form/variant labels.
4. A user can create collections containing photos from multiple species.
5. A collection can define sequence and two-dimensional placement for each item.
6. A user can publish a read-only collection page.
7. Existing generated dex metadata remains separate from user content.

The first V4 release should not attempt to rebuild every V3 feature or launch a social network. It should prove the account, upload, collection, and public-viewing path end to end.

## V3 Completion Work

These open issues are part of the current product and should be completed before the V4 migration:

### Issue #64: Add Different Paldean Forms of Tauros

Add these exact labels to Tauros (`data.json`):

- `Tauros - Combat Breed`
- `Shiny Tauros - Combat Breed`
- `Tauros - Blaze Breed`
- `Shiny Tauros - Blaze Breed`
- `Tauros - Aqua Breed`
- `Shiny Tauros - Aqua Breed`

Because these are form-specific labels that are not supplied by the current PokeAPI entry set, mirror the exact labels in `data-entries-overrides.json`. Keep regular forms before shiny forms and run `node test.js`.

### Issue #61: Cycle Across Pokemon in the Dex

Allow gallery navigation to move both between variants of the current species and between neighboring species without closing the gallery. Provide visible previous/next species controls on desktop and mobile, while preserving keyboard navigation and boundaries.

### Issue #58: Add Mega Entries

Add missing Mega form entries to the overrides workflow. The implementation should keep form labels exact and should avoid hand-maintaining generated `data-entries.json`. This work should share the same validation path as issue #64.

### Issue #20: Power Button

Add the V3 powered-off state for the dex container. The state should be visual only, preserve the current theme behavior, and remain accessible through a clearly labeled control. Do not couple this presentation state to authentication or server state.

### V3 Exit Criteria

- The V3 issue set is either closed or explicitly deferred.
- `node test.js` passes.
- The static app loads through a local HTTP server and GitHub Pages.
- Gallery, search, capture count, themes, and responsive layouts continue to work.
- Form labels resolve to the correct override entries.
- The V4 work does not require changing the meaning of the existing static data files.

## V4 Technical Roadmap

### Phase 1: Establish the Application Foundation

Introduce a typed application without discarding the V3 UI behavior all at once.

Recommended baseline:

- TypeScript.
- React with a framework that supports server routes, preferably Next.js.
- PostgreSQL for relational data.
- Prisma or an equivalent typed database layer.
- An authentication provider such as Auth.js, Clerk, or Supabase Auth.
- Object storage such as S3, Cloudflare R2, or Supabase Storage.
- A deployment target that supports the web app, API routes, database, and background work.

Keep the V3 static data as imported reference data during the first migration. Do not make the browser depend on a large user-editable replacement for `data.json`.

### Phase 2: Define the Data Model

Separate reference data from user-owned data.

Reference entities:

- `PokemonSpecies`: dex number, canonical name, genus.
- `PokemonVariant`: exact display label, species relationship, form metadata.
- `DexEntry`: generated source and text, linked to a species or supported form.
- `DataImport`: source, version, checksum, and import timestamp.

User entities:

- `User`: provider identity and account metadata.
- `Photo`: owner, storage key, metadata, visibility, and timestamps.
- `PhotoVariant`: optional link from a photo to a known species/form label.
- `Collection`: owner, title, description, visibility, and timestamps.
- `CollectionItem`: collection, photo, ordering value, x/y position, and optional caption.
- `CollectionShare`: public identifier and publication settings.

Important constraints:

- A photo belongs to exactly one owner.
- A photo may be reused in many collections.
- A collection may contain photos from different species.
- Collection order and canvas position are independent properties.
- Deleting a photo must have an explicit policy for collections that reference it.
- Reference data must not be overwritten by user edits.

### Phase 3: Add Authentication and Authorization

Implement account flows before uploads:

- Sign up, sign in, sign out, and account deletion.
- Session handling on server-rendered and API requests.
- Ownership checks for every photo, collection, and private share operation.
- Public read access only for explicitly published collections.
- Server-side validation; never trust owner IDs or visibility flags supplied by the browser.
- Rate limits for sign-in, uploads, and public endpoints.

Add authorization tests for owner, authenticated non-owner, unauthenticated, and published-public cases.

### Phase 4: Build the Photo Workflow

Create the first useful user-owned feature:

1. Select a local image.
2. Validate file type and size on the server.
3. Upload through a short-lived signed storage request or a server-managed upload.
4. Store metadata in `Photo`.
5. Generate a thumbnail and normalized display metadata in background work.
6. Show upload, processing, failure, retry, and deletion states.
7. Optionally associate the photo with a dex species and exact variant label.

The browser should receive storage URLs only when needed for rendering. The server must never treat URL hashing as access control.

### Phase 5: Build Collections

Implement issue #56 as the first major V4 feature:

- Create, rename, archive, and delete collections.
- Add the same photo to multiple collections.
- Reorder items chronologically or manually.
- Position items on a two-dimensional canvas.
- Store orientation and placement as structured values, not encoded in labels.
- Provide optional collection description text and an intentional empty state.
- Browse a user\'s own collections from the account area.
- Add a dex-level entry point for filtering or browsing collections.

Start with a simple grid/canvas editor. Keep the data model flexible enough for evolution-line sequences and composite scenes without requiring a visual editor rewrite.

### Phase 6: Publish Read-Only Collections

Add public sharing after private collections work:

- Generate non-guessable public identifiers.
- Allow the owner to publish and unpublish a collection.
- Render a read-only page without exposing private account data.
- Add social preview metadata and stable image thumbnails.
- Revoke access immediately when unpublished.
- Keep editing endpoints authenticated and owner-protected.

This phase creates a useful public surface while keeping comments, follows, and likes out of the first V4 release.

### Phase 7: Resolve Existing V4 Research Items

#### Issue #59: Automate Mega Identification and Entries

Treat this as a reference-data pipeline problem, not a user-content problem:

- Investigate PokeAPI and other permitted structured sources.
- Build a repeatable import or verification script.
- Compare discovered forms against `data.json` labels and overrides.
- Produce a review report for entries that still require human confirmation.
- Keep generated output reproducible and versioned.

Do not scrape blindly or silently replace curated labels.

#### Issue #24: Gender-Specific Entries

First measure scope before adding schema complexity:

- Identify species with meaningful gender differences.
- Separate functional distinctions from cosmetic distinctions.
- Decide whether gender is a reference-data variant, a photo attribute, or both.
- Add only after representative UI and lookup tests exist.

#### Issue #2: Image URL Privacy

Client-side hashing cannot hide a usable image URL from a browser that must render the image. In V4, address the underlying concern with:

- Private object storage.
- Short-lived signed URLs or an authenticated image proxy.
- Ownership and publication checks before issuing access.
- Thumbnail derivatives that do not expose the original storage key.
- Access and abuse monitoring.

This protects access to the image without promising that rendered pixels can never be copied.

## Migration Strategy

1. Freeze the V3 reference-data schema and document its import version.
2. Create a one-time importer for species, variants, and generated dex entries.
3. Add V4 tables without modifying user-facing V3 data files.
4. Keep the static V3 route available while the authenticated V4 route is developed.
5. Add feature flags for account, upload, and collections features.
6. Migrate only canonical reference data first; do not invent users or photo ownership for existing branch-specific Imgur URLs.
7. Move new user uploads exclusively into V4 storage.
8. Remove the temporary dual route only after the V4 workflows have end-to-end coverage.

The existing `main` and `LitoFrito` branches remain relevant for V3 maintenance. V4 should establish a deployment branch and environment strategy that does not require copying personal image URLs between branches.

## Testing and Operations

Required before the first V4 release:

- Unit tests for data import, label lookup, collection ordering, and placement validation.
- API tests for authentication and ownership rules.
- Integration tests for upload processing and failed uploads.
- Playwright tests for sign-in, upload, collection editing, publishing, and unpublishing.
- Regression tests for the existing gallery, search, theme, and responsive behavior.
- Database migrations that can be applied to a fresh environment and a backup.
- CI checks for formatting, type safety, tests, and dependency auditing.
- Error monitoring, structured server logs, and basic upload/storage metrics.
- Documented local setup with environment variables and a seeded reference database.

## V4 Definition Of Done

V4 is ready for its first full-stack release when a new user can sign up, upload a photo, associate it with a Pokemon form, add it to more than one collection, arrange collection items, publish a read-only collection page, and delete their content. The reference dex still loads correctly, private content is inaccessible to other users, and the complete flow is covered by automated tests.

## Recommended Delivery Order

1. Finish V3 data, navigation, Mega, and power-state issues.
2. Create the TypeScript/full-stack shell and reference-data importer.
3. Add authentication and authorization tests.
4. Add photo storage and processing.
5. Add private collections and placement.
6. Add public read-only sharing.
7. Automate Mega verification and evaluate gender-specific data.
8. Replace client-visible image URLs with authenticated storage access.
9. Retire temporary V3/V4 duplication after production validation.
