# Celestial Nexus Toolkit v2.0.1 — Data Integrity R3

This archive is a **repo-root overlay** for `Elusyon117/Celestial-Alliance-Nexus-toolKit`.
Extract it over the repository root and replace the matching files.

## Included files

- `index.html`
- `sw.js`
- `data/live-build.json`
- `scripts/sync-live-build.mjs`
- `.github/workflows/sync-game-data.yml`
- `.github/workflows/sync-mrkraken-language-pack.yml`
- `PATCH_NOTES.md`
- `VALIDATION.txt`
- `MANIFEST.sha256`

No existing repo files outside that list need to be deleted.

## Fixes implemented

### 1. Main hub LIVE build identity

- The top-left hub header no longer starts at `GAME DATA · resolving LIVE…`.
- The bundled last-known current build is `4.10.0-LIVE.12519617`.
- A new `data/live-build.json` file is the repo-local LIVE-build authority.
- `scripts/sync-live-build.mjs` refreshes it from the Star Citizen Wiki default game-version endpoint.
- Runtime refresh still attempts online verification, but a temporary upstream/network failure no longer leaves the hub stuck on `resolving LIVE…`.
- Wiki game-data requests remain version-pinned where supported.

### 2. Vehicle Loadout Manager — component store availability / prices

The acquisition planner was rejecting the entire UEX pricing source when the UEX metadata endpoint was healthy but did not expose `game_version`. That made valid purchasable components, including Hemera, appear as **Not buyable in stores**.

The UEX validation layer now:

- recognizes version metadata from multiple UEX response shapes/endpoints;
- still rejects an explicit incompatible patch;
- does **not** globally disable component store data solely because the metadata endpoint omits `game_version`;
- leaves row-level/current-family filtering in place so actual price records are still checked before use.

This fixes the systemic false-unavailable state rather than special-casing Hemera.

### 3. Contract Finder — payout and reputation preservation

The Contract Finder could load a valid payout/reputation in the list/snapshot, then overwrite it with `null`, blank, or an empty array from the detail endpoint.

The detail merge is now non-destructive:

- meaningful summary values survive null/blank detail fields;
- the original normalized summary is retained separately;
- payout resolution checks the active record, merged raw record, immutable summary, and raw API attributes;
- reputation and unlock requirements use the same source-layer fallback strategy without double-counting.

If the upstream sources genuinely expose no fixed payout, the UI still says that it is not exposed; this patch does not invent a reward.

### 4. Vehicle Loadout Manager — quantum-drive cooldown

The detailed performance view now includes **Q cooldown** in seconds.

The value is read from the quantum drive's standard-jump cooldown field (with the compatible fallback field when necessary) and is also included in the quantum-drive component metrics. It represents the cooldown after a standard/long quantum jump before the drive is ready again.

### 5. Blueprint Finder — all material-affected stats

Blueprint output rows are no longer limited to stats that already exist in the item-class-specific table.

For every blueprint output class, exact material modifiers are appended when the corresponding affected stat is otherwise missing. This covers effects such as:

- Damage Mitigation
- Min Temperature
- Max Temperature
- other exact blueprint/material modifier paths returned by the source

Rows are deduplicated by stat key, exact property path, and label. When the item API does not publish a meaningful absolute base value, the Blueprint Finder shows the exact blueprint modifier baseline → selected value rather than fabricating an absolute item stat.

### 6. Service worker / cache revision

- Service-worker registration revision bumped to `2.0.1-data-integrity-r3`.
- `data/live-build.json` is part of the core cache.
- Installation uses per-asset `Promise.allSettled`, so one optional/missing asset no longer prevents the whole service worker from installing.
- Existing navigation/data/static/image caching strategies are preserved.

### 7. GitHub Actions / workflow hardening

`sync-game-data.yml` keeps the existing SCMDB synchronization and patch audit, and additionally:

- syntax-checks `scripts/sync-live-build.mjs`;
- refreshes `data/live-build.json`;
- commits that file with the other synchronized snapshots;
- includes the current LIVE build in patch-review issue output.

`sync-mrkraken-language-pack.yml` keeps its release-download/validation behavior, while reducing bot push conflicts:

- scheduled at minute 37 instead of the same minute as game-data sync;
- uses `actions/checkout@v5` with full history;
- pulls/rebases before push and retries the push up to three times.

The historical one-time 4.9 SCMDB workflow is intentionally not replaced by this patch.

## Installation

1. Back up or commit your current working tree.
2. Extract this archive into the repository root.
3. Allow the archive to overwrite the matching files listed above.
4. Commit and push the changes.
5. Run **Sync game data** once with the default LIVE settings after merging/deploying. This refreshes the local LIVE-build authority and normal game-data snapshots from the runner's network environment.
6. Hard-refresh the deployed site once, or close/reopen the installed PWA, so the new service-worker revision takes control.

## Validation performed

See `VALIDATION.txt` for the exact automated checks performed in the build environment.

Key checks passed:

- every active inline JavaScript block in the updated `index.html` parses successfully;
- no duplicate DOM IDs were introduced;
- `sw.js` and `scripts/sync-live-build.mjs` pass `node --check`;
- both modified workflow YAML files parse successfully;
- every `run:` shell block in those workflows passes `bash -n`;
- the LIVE-build sync script successfully preserves the last valid local build when outbound networking is unavailable.

A real browser end-to-end run and live third-party API integration run could not be executed in the packaging container because browser/network access is restricted there. The GitHub Actions runner is the recommended place to perform the first live synchronization after applying the overlay.

## External data authority used for this patch

- Star Citizen Wiki API: `https://api.star-citizen.wiki/api/game-versions/default`
- Current pinned build bundled in this release: `4.10.0-LIVE.12519617`

