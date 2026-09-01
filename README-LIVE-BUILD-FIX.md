# Celestial Nexus current-LIVE data fix

This patch changes the toolkit from “newest data each source happens to return” to “resolve one authoritative LIVE patch, then accept only LIVE data that matches it.”

## Important workflow-integrity note

**Do not replace or delete the entire `.github/workflows` directory.** Merge the bundle into the repository and replace only the workflow named below.

- Keep `.github/workflows/sync-mrkraken-language-pack.yml` exactly as it is. This patch does not change the MrKraken language-pack mirror workflow, its manual trigger, its six-hour schedule, its permissions, or its data files.
- Replace only `.github/workflows/sync-game-data.yml` with the bundled version. Its existing manual trigger, LIVE/PTU/EPTU channel selector, six-hour schedule, `contents: write` / `issues: write` permissions, concurrency behavior, SCMDB synchronization, patch audit, commit/push behavior, review issue, and failure issue remain present. The new LIVE resolver and verification steps are additive.
- Retire `.github/workflows/sync-scmdb-4.9-once.yml`. That file is a historical one-shot importer hard-coded to `MISSION_PATCH: 4.9.0`, a 4.9 release asset name, and 4.9-specific verification. Leaving it runnable after LIVE advances creates an intentional path back to stale 4.9 mission data.

The updated main workflow resolves the authoritative LIVE build **only for LIVE runs**. Manual PTU/EPTU runs retain their prior behavior and are not blocked by the LIVE resolver or LIVE-only verification.

## Replace / add

- Replace repository `index.html` with this bundle's `index.html`.
- Replace `sw.js` with this bundle's `sw.js` so old PWA caches are retired.
- Add `scripts/resolve-live-build.mjs`.
- Add `scripts/verify-live-data.mjs`.
- Add/replace `data/live-build.json` (the LIVE workflow refreshes it).
- Replace `.github/workflows/sync-game-data.yml` only.
- Keep `.github/workflows/sync-mrkraken-language-pack.yml` untouched.
- Delete `.github/workflows/sync-scmdb-4.9-once.yml`; it is a historical 4.9-only workflow and should not remain available as a normal data-update path.

## Behavior

1. For LIVE runs, GitHub Actions resolves current LIVE from official CIG pages, with UEX and Star Citizen Wiki as corroborators.
2. For LIVE syncs, the resolved patch is passed to the existing SCMDB importer as `MISSION_PATCH`. SCMDB can no longer define “latest LIVE” by itself.
3. Manual PTU/EPTU runs skip the LIVE resolver and retain the existing selected-channel behavior.
4. The browser loads `data/live-build.json` first when fresh, and can independently corroborate with UEX `/data_parameters`, Star Citizen Wiki game versions, and CIG Known Issues.
5. Contract Finder resolves the current LIVE authority before it inspects bundled or local snapshots. An older snapshot cannot bootstrap the target patch to itself anymore.
6. Commodity Trading requires UEX `/data_parameters.game_version` to match the resolved current LIVE patch. Cross-patch cached market data is blocked.
7. The legacy 4.9 EPTU fuel table is retired. If current sources do not expose a trustworthy ship range, the UI requires a manual current-LIVE range instead of retaining an old estimate.
8. The Game Status fallback is updated to the current 4.10.0 LIVE bootstrap and expires after 30 days if official refreshes fail.
9. The service-worker cache version is bumped; data requests are network-first and the application-side version guard rejects stale cross-patch data even if a cached response is returned while offline.

## Current verification used for this patch

As of 2026-09-01, CIG's current support material identifies `4.10.0-live.12519617`. UEX documents `/data_parameters` as the endpoint that reports its current LIVE `game_version`.
