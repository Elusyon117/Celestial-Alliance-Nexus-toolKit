# Celestial Nexus Toolkit v1.6.0

Celestial Nexus Toolkit is a single-page Star Citizen organization toolkit for operations planning, cargo routing, contract discovery, vehicle loadouts, item lookup, mining support, and live-status reference.

## What changed in v1.6.0

Version **1.6.0** focuses on repository cleanup plus the latest UI and contract workflow updates:

- Module pages now use a simplified top-right navigation pattern: **Hub** remains available and Discord can remain visible, while cross-module buttons are removed from module headers.
- Cargo Hauling contract selection now displays the actual contract title instead of the payout or mission identifier.
- Contract Finder now uses SCMDB-style visual tags for contract traits such as **ILLEGAL**, legal, shareable, combat, hauling, blueprints, chain contracts, systems, and categories.
- Contract detail pages were redesigned with clearer payout, reputation, duration, profile, briefing, requirements, calculator inputs, cargo manifest, combat breakdown, locations, operations, rewards, and raw-source panels.
- Calculator and combat sections auto-populate when the SCMDB/source record exposes those fields. When data is missing, the UI now explains that the source did not publish it instead of appearing broken.
- The application metadata, service-worker cache name, manifest metadata, and repository docs have been advanced to **v1.6.0**.

## Files in this update package

Upload or copy these files into the root of the GitHub repository:

| File | Purpose |
| --- | --- |
| `index.html` | Main Celestial Nexus Toolkit app, updated to v1.6.0. |
| `manifest.webmanifest` | Progressive Web App manifest with v1.6.0 metadata. |
| `sw.js` | Service worker using a v1.6.0 cache key so browsers refresh the app shell. |
| `README.md` | This repository overview. |
| `VERSION.txt` | Plain-text version marker. |
| `CHANGELOG.md` | Release history including v1.6.0. |
| `PATCH_REPORT.json` | Machine-readable summary of this patch. |
| `PACKAGE_REPORT.json` | File list and package checks. |
| `SHA256SUMS_PATCH.txt` | Checksums for uploaded patch files. |
| `docs/UPLOAD_PATCH_INSTRUCTIONS.md` | Step-by-step GitHub upload instructions. |
| `docs/REPOSITORY_CLEANUP.md` | Suggested cleanup list for old patch artifacts. |

## Required repository files

Keep these in the repository unless you intentionally remove the feature that uses them:

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `.nojekyll`
- `404.html`
- `icons/` and the root `icon-192.png` / `icon-512.png` files if your manifest or README references them
- `data/`, especially SCMDB mission snapshots such as `data/scmdb-missions-live.js` or `data/scmdb-missions-live.json`
- `assets/wikelo/` if item/ship/media fallback data still depends on it
- `.github/workflows/` only if GitHub Pages or release automation uses it

## Deployment

For a GitHub Pages repository, extract this zip locally, copy the contents into the repository root, commit the changes, and push. If you use the GitHub web UI, upload the extracted files and folders at the repository root, not inside a nested package folder.

After deployment, hard-refresh the site once or unregister the old service worker if the previous version remains cached.

## Version

Current release: **Celestial Nexus Toolkit v1.6.0**
