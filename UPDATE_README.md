# Celestial Nexus v2.0.0-r2 repository update

This ZIP is a **repository overlay** containing every file that must change for the completed Org Picture Creator, FPS Loadout Manager, and Blueprint Finder work.

## Apply safely

1. Make a backup or create a new Git branch.
2. Extract this folder over the root of your existing `Elusyon117/Celestial-Alliance-Nexus-toolKit` clone.
3. Preserve all other repository files and directories.
4. Commit the replaced and added files.
5. Push the branch and let the existing GitHub Actions workflows run.

## Files replaced

- `index.html`
- `release.json`
- `sw.js`
- `scripts/validate-repo.mjs`
- `SHA256SUMS.txt`

## File added

- `assets/images/modules/fps-loadout-br2-blueprint-banner.png`

## Workflow compatibility

The four files under `.github/workflows/` are intentionally not replaced. The validation script was updated because the FPS spread and recoil charts were intentionally removed, and it now validates the replacement crafted-blueprint features instead. Service-worker revision `2.0.0-r2` refreshes the application cache and pre-caches the new FPS banner.

After deployment, open the site once while online so the new service worker can activate and clear the older `2.0.0-r1` caches.
