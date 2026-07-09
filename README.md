# Celestial Alliance Nexus Toolkit — stable reset package

This package resets the repository to the stable optimized toolkit version selected after testing.

## What is included

- `index.html` — stable optimized toolkit HTML
- `manifest.webmanifest`
- `sw.js` — clean stable service worker, without the experimental image catalog/cache work
- `data/` — SCMDB mission snapshots plus a roster snapshot
- `assets/wikelo/` — Wikelo artwork referenced by the toolkit
- root and `icons/` app icons
- `.nojekyll` and `404.html` for GitHub Pages

## Restore instructions

1. In your local repository folder, delete the current contents except the `.git` folder.
2. Extract this ZIP into that repository folder.
3. Open GitHub Desktop.
4. Commit all deletions/additions with: `Reset toolkit to stable optimized base`.
5. Push to `main`.

Do not copy back the old experimental folders such as `assets/images/ships/catalog/`, `assets/images/embedded/`, or `assets/images/remote/`.
