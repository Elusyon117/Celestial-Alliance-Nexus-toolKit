# Celestial Alliance Nexus Toolkit v1.9.1-r3

A browser-based Star Citizen alliance operations toolkit maintained by Elusyon.

This overlay repairs the repository validation mismatch and the Vehicle Loadout Manager component-picker loading path while preserving the visible application version **1.9.1**. The service-worker cache revision is **1.9.1-r3** so deployed browsers discard the earlier cached HTML.

## Apply this overlay

1. Back up the repository or create a branch.
2. Extract the ZIP into the repository root and allow it to replace matching files.
3. Keep all existing `assets/`, `data/`, `icons/`, and workflow files that are not included in the ZIP.
4. Commit and push the replacements.
5. Run **Validate toolkit** in GitHub Actions.
6. After GitHub Pages redeploys, open the site in a private window or hard-refresh it.

Detailed replacement and verification steps are in `DEPLOY_UPDATE.md`.

## Files changed

- `index.html` — progressive, bounded Vehicle Loadout Manager component loading with usable cached/stock fallback.
- `sw.js` — cache revision `1.9.1-r3`.
- `manifest.webmanifest` — PWA manifest identity stabilized and icon cache tags aligned to `1.9.1`.
- `release.json` — single source of truth for app and cache versions.
- `scripts/validate-repo.mjs` — validates against `release.json` and checks cache/PWA alignment.
- `scripts/audit-patch-data.mjs` — corrected version test and removed false warnings caused by legitimate historical patch references.
- `docs/RELEASE_NOTES_v1.9.1-r3.md` — release notes.

## Vehicle Loadout Manager behavior

The picker now opens immediately with stock and cached options. Live compatible components are fetched with bounded type-and-size requests, a total timeout, limited concurrency, and failure-safe caching. A failed request no longer leaves the modal permanently on “Loading,” and failed empty results are not retained as successful catalog data.

## Generated data

Do not delete the repository’s existing generated data. The overlay does not replace mission, roster, language-pack, price, or game-status mirrors.

## Validation record

See `docs/HOTFIX_VALIDATION.md` for the completed checks and the live-environment limitation.
