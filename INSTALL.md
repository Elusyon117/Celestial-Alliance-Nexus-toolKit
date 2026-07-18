# Installation — v1.8.0 clean replacement

## Before replacing the repository

The repository currently tracks generated SCMDB and MrKraken mirrors. If you need the current offline data to remain available immediately, make a temporary local backup of:

- `data/scmdb-missions-live.json`
- `data/scmdb-missions-live.js`
- `data/game-data-status.json`
- `data/mrkraken-global.ini`
- `data/mrkraken-release.json`

The clean package can regenerate them, but SCMDB 4.9 requires the release-asset import procedure.

## Replace the files

1. Clone or open the existing repository locally.
2. Delete all repository contents **except `.git/`**.
3. Extract this ZIP into the repository root.
4. Confirm `index.html`, `.github/`, `assets/`, `data/`, `icons/`, and `scripts/` are at the root.
5. Commit with a message such as `Release Celestial Nexus Toolkit v1.8.0`.
6. Push to `main`.

## GitHub Pages

Use **Settings → Pages → Deploy from a branch**, with `main` and `/ (root)` unless the repository already uses a different Pages deployment method.

After Pages deploys:

1. Open the site.
2. Hard-refresh once (`Ctrl+Shift+R` or `Cmd+Shift+R`).
3. If an older build remains, clear site data or unregister the older service worker once.

## Validate

Run **Actions → Validate toolkit → Run workflow**. The workflow checks version metadata, inline JavaScript syntax, duplicate IDs, JSON validity, required files, and local markup references.

## Populate mission data

Follow [docs/SCMDB_4_9_IMPORT.md](docs/SCMDB_4_9_IMPORT.md). Do not expect the workflow to create the temporary release asset automatically.

## Populate Language Lab data

Run **Actions → Sync MrKraken language pack → Run workflow**. This downloads the latest LIVE localization ZIP, validates at least 10,000 entries, and commits the mirror.
