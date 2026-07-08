# Repository Cleanup Guide — v1.6.0

This repository appears to contain several one-off patch notes and upload helper files from earlier updates. After v1.6.0 is live and verified, these are usually safe to remove or archive if no workflow references them.

## Usually safe to delete after this update

- `MISSION_483_PATCH_UPLOAD.txt`
- `MISSION_FINDER_PAYOUT_PATCH_UPLOAD.txt`
- `UPLOAD_INSTRUCTIONS.txt`
- Older `UPLOAD_PATCH_INSTRUCTIONS.md` files if replaced by `docs/UPLOAD_PATCH_INSTRUCTIONS.md`
- Old `PATCH_REPORT.json` and `PACKAGE_REPORT.json` files after replacing them with the v1.6.0 versions
- Old `SHA256SUMS_PATCH.txt` after replacing it with the v1.6.0 checksum file
- Temporary root-level patch notes named like `*_PATCH_UPLOAD.txt`

## Delete only after confirming they are not referenced

- `MISSION_FINDER_DATA_DISPLAY.md` — safe to archive if it is only old documentation.
- `SCMDB_MISSION_SYNC_SETUP.md` — keep if you still use it to regenerate the `data/` snapshots.
- `scripts/` — keep if you use scripts to build, sync SCMDB data, or generate release artifacts.
- `.github/workflows/` — keep if GitHub Pages or any deployment automation depends on it.
- `docs/` — keep current docs; remove only outdated docs that are no longer linked.

## Do not delete unless you are intentionally removing app functionality

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `.nojekyll`
- `404.html`
- `data/` — the app references SCMDB snapshots such as `data/scmdb-missions-live.js` and/or `data/scmdb-missions-live.json`.
- `assets/wikelo/` — may support item/media/wiki lookup fallbacks.
- `icons/` and root icons such as `icon-192.png` / `icon-512.png` if the manifest or README references them.

## Suggested cleaner root after cleanup

A tidy root can look like this:

```text
.github/workflows/      optional, only if used
assets/                 app assets
assets/wikelo/          keep if used by item/wiki data
data/                   SCMDB and bundled data snapshots
docs/                   current documentation only
icons/                  icon assets
scripts/                optional build/sync helpers
.gitignore
.nojekyll
404.html
CHANGELOG.md
CONTRIBUTING.md
LICENSE_NOTICE.md
README.md
SECURITY.md
SHA256SUMS_PATCH.txt
VERSION.txt
icon-192.png
icon-512.png
index.html
manifest.webmanifest
sw.js
```
