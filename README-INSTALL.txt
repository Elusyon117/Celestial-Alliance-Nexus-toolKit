CELESTIAL NEXUS LANGUAGE LAB — OFFLINE-FIRST SHIP CATALOG V5

This update fixes the Language Lab ASOP ship selector.

Repository files to replace/add:
  index.html
  sw.js
  .github/workflows/sync-mrkraken-language-pack.yml
  data/mrkraken-release.json

Keep the generated data/mrkraken-global.ini already created by the GitHub Action.
If it is missing, run the “Sync MrKraken language pack” workflow once.

SHIP CATALOG FIX
- 291 ships and vehicles are preloaded directly into index.html.
- The selector no longer waits for the external vehicle API.
- Live API records are merged only as optional enrichment.
- An empty API response no longer suppresses the embedded fallback catalog.
- The custom searchable selector is refreshed whenever the Language Lab opens.

DEPLOYMENT
1. Extract this ZIP into the repository root and overwrite index.html and sw.js.
2. Commit and push the files.
3. Wait for GitHub Pages to redeploy.
4. Hard-refresh the site. If an older service worker remains, clear site data once.
5. Open Language Pack Lab. The ship selector should immediately report 291 or more options.

The V4 direct-install language-pack export layout is preserved.
