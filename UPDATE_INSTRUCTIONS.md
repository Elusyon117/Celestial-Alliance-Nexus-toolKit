# Celestial Nexus Toolkit v2.0.2 — Update Instructions

This ZIP is a **repository overlay**. Copy its files into the root of the existing `Celestial-Alliance-Nexus-toolKit` repository, preserving paths.

## Files replaced / added

- `index.html` — v2.0.2 browser fixes for Wikelo data retention and Contract Finder faction names.
- `sw.js` — new cache revision so old clients do not remain on the broken HTML/data bundle.
- `scripts/sync-scmdb-missions.mjs` — resilient SCMDB → Star Citizen Wiki → usable-snapshot synchronization.
- `scripts/validate-toolkit.mjs` — static/CI integrity checks.
- `scripts/test-data-resilience.mjs` — regression tests for Wikelo retention, faction names, SCMDB enrichment, and Wiki fallback.
- `.github/workflows/sync-game-data.yml` — updated data workflow with preflight, regression tests, fallback-aware reporting, and post-sync validation.

No generated `data/scmdb-missions-live.*` file is included in this overlay. The workflow generates the current snapshot after merge. This avoids shipping fabricated or partial mission data in the patch.

## Recommended update sequence

1. Create a branch from the repository's current default branch.
2. Extract this ZIP over the repository root and allow the listed files to replace their existing versions.
3. Run the offline checks:

   ```bash
   node --check scripts/sync-scmdb-missions.mjs
   node --check scripts/validate-toolkit.mjs
   node --check scripts/test-data-resilience.mjs
   node scripts/validate-toolkit.mjs --pre-sync
   node scripts/test-data-resilience.mjs
   ```

4. Commit/push the branch and run **Sync game data** from GitHub Actions. Leave the patch input blank to select the newest build in the chosen channel; use `LIVE` for the production site.
5. After the action completes, confirm `data/game-data-status.json` reports one of:
   - `current` with source `SCMDB`, or
   - `current-wiki-fallback` with source `Star Citizen Wiki`.

   Both are populated/current operating modes. A `stale-*` status means both current upstreams were temporarily unavailable and a previously usable catalog was preserved.
6. Merge/deploy. The new `sw.js` cache namespace is `data-resilience-v1-20260906`, so installed/PWA clients will move off the old cache on activation.

## What should be visible after deployment

### Wikelo Trade Center

- Trade catalog is populated immediately from the bundled curated catalog rather than showing zero/blank recipes.
- The current repository SCMDB snapshot is checked first for mission/recipe detail.
- The current Star Citizen Wiki mission API is used as a second current-data cross-check, especially for mission metadata and reputation.
- A current API that omits recipe fields **does not erase** a valid curated recipe. The recipe source/provenance remains explicit.
- Material Locker readiness and Org Project Plan totals operate on the retained recipe requirements.

### Contract Finder

- Human-readable faction names are preferred from enriched SCMDB faction dictionaries or nested faction objects.
- Raw GUID/UUID values are not displayed as faction names.
- If a GUID cannot be resolved, the UI shows `Unspecified faction` and may asynchronously enrich names from the Star Citizen Wiki faction endpoint.
- The source chain remains: bundled/repository snapshot → live SCMDB → current Star Citizen Wiki fallback.

## Important source behavior

SCMDB remains the preferred source because it can expose richer extracted game-data relationships. The Star Citizen Wiki is a current-version fallback and cross-check, not a claim that both APIs expose identical fields. Wikelo community recipe rows are retained when the live APIs omit exchange requirements, and they are labeled as community snapshot data instead of being silently promoted to current authoritative values.
