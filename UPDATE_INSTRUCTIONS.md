# Update Instructions — Celestial Nexus Toolkit v2.0.3

This ZIP is a repository overlay. Copy its contents into the root of `Celestial-Alliance-Nexus-toolKit` and allow matching files to be replaced. Preserve the `.github` directory when copying.

## Files intentionally replaced or added

- `index.html`
- `sw.js`
- `.github/workflows/sync-game-data.yml`
- `.github/workflows/validate-toolkit.yml`
- `scripts/sync-scmdb-missions.mjs`
- `scripts/audit-patch-data.mjs`
- `scripts/validate-repo.mjs`
- `scripts/validate-toolkit.mjs`
- `scripts/test-data-resilience.mjs`
- documentation/report files included with this update

Existing assets and repository data files that are not included in the ZIP should remain in place.

## Recommended deployment sequence

1. Copy the overlay into the repository, commit, and push to `main`.
2. In GitHub Actions, manually run **CA Toolkit V 2.0.3**. It should validate the repository without the old hard-coded version/YAML dependency failure paths.
3. Manually run **Sync game data**. If SCMDB is reachable it will synchronize exact SCMDB `contracts + legacyContracts` plus supporting dictionaries. If SCMDB is still unavailable, the run should build a full current-version Wiki fallback instead of publishing an empty/tiny snapshot.
4. After Pages deploys, hard-refresh the toolkit. The service-worker cache namespace has been bumped, so old v2.0.2 HTML should be replaced.

## What to check after Sync game data

Open Contract Finder and look at its source/status line. It should show the loaded contract count and number of named factions. With SCMDB as the source, the generated JSON also contains a `scmdbParity` object with active, legacy, total, and faction counts.

The faction picker should no longer be limited by the old one-page fallback. Unknown GUIDs are suppressed rather than shown as names.

Open Wikelo Trade Center and verify that the yellow generic "Recipe shown from..." box is gone while material quantities remain visible.

## Optional SCMDB mirrors

If you maintain a mirror for SCMDB data, set repository variable `SCMDB_MIRROR_URLS` to a comma-separated list of dataset/manifest URLs. The sync script tries these after the primary SCMDB service and before the Wiki fallback.

## Local verification

With Node.js 22+ from the repository root:

```bash
node scripts/validate-repo.mjs
node scripts/validate-toolkit.mjs --pre-sync
node scripts/test-data-resilience.mjs
```

After a data sync, run:

```bash
node scripts/audit-patch-data.mjs
node scripts/validate-toolkit.mjs
node scripts/validate-repo.mjs
```
