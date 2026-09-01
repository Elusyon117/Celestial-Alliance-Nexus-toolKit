# Celestial Nexus current-LIVE data fix

This patch changes the toolkit from “newest data each source happens to return” to “resolve one authoritative LIVE patch, then accept only data that matches it.”

## Replace / add

- Replace repository `index.html` with this bundle's `index.html`.
- Replace `sw.js` with this bundle's `sw.js` so old PWA caches are retired.
- Add `scripts/resolve-live-build.mjs`.
- Add `scripts/verify-live-data.mjs`.
- Add/replace `data/live-build.json` (the workflow refreshes it every run).
- Replace `.github/workflows/sync-game-data.yml`.
- Delete `.github/workflows/sync-scmdb-4.9-once.yml`; it is a historical one-shot workflow and should not remain available as a normal data update path.

## Behavior

1. GitHub Actions resolves current LIVE from official CIG pages, with UEX and Star Citizen Wiki as corroborators.
2. For LIVE syncs, the resolved patch is passed to the existing SCMDB importer as `MISSION_PATCH`. SCMDB can no longer define “latest LIVE” by itself.
3. The browser loads `data/live-build.json` first when fresh, and can independently corroborate with UEX `/data_parameters`, Star Citizen Wiki game versions, and CIG Known Issues.
4. Contract Finder resolves the current LIVE authority before it inspects bundled or local snapshots. A 4.9 snapshot cannot bootstrap the target to 4.9 anymore.
5. Commodity Trading requires UEX `/data_parameters.game_version` to match the resolved current LIVE patch. Cross-patch cached market data is blocked.
6. The legacy 4.9 EPTU fuel table is retired. If current sources do not expose a trustworthy ship range, the UI requires a manual current-LIVE range instead of inventing/retaining a 4.9 estimate.
7. The Game Status fallback is updated to the current 4.10.0 LIVE bootstrap and expires after 30 days if official refreshes fail.
8. The service-worker cache version is bumped; data requests are network-first and the application-side version guard rejects stale cross-patch data even if a cached response is returned while offline.

## Current verification used for this patch

As of 2026-09-01, CIG's current support material identifies `4.10.0-live.12519617`. UEX documents `/data_parameters` as the endpoint that reports its current LIVE `game_version`.
