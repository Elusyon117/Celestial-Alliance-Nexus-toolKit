CELESTIAL NEXUS LANGUAGE LAB — TEACH MINING VARIANTS V7

Repository files to replace/add:
  index.html
  sw.js
  .github/workflows/sync-mrkraken-language-pack.yml
  data/mrkraken-release.json

Keep the generated data/mrkraken-global.ini already created by the GitHub Action.
If it is missing, run the “Sync MrKraken language pack” workflow once.

ROOT CAUSE FIXED
V6 tried to read the synchronized language file through window/globalThis.nexusLangState.
The toolkit declares nexusLangState with a top-level const, so it is available to later classic
scripts as a global lexical binding but is not a property of window. The V6 catalog therefore saw
an empty language file and showed only embedded entries, which is why Wikelo rows appeared while
current Teach editions did not.

V7 CHANGES
- Reads nexusLangState.baseText through the correct global lexical binding.
- Discovers the exact current vehicle_Name records for MOLE Teach’s Special and Golem Teach’s Special.
- Retains full/short pairs and also accepts short-only or alternate vehicle_Name key forms.
- Pins selected editions to their exact localization key and vehicle class.
- Prevents a missing special-edition key from falling back to and renaming the standard base ship.
- Adds Prospector Teach’s Special as a provisional compatibility row because community references
  list that edition, while some current game/localization builds do not expose a distinct ASOP key.
  When its exact key is absent, the build reports a warning and leaves the standard Prospector untouched.
- Preserves the complete embedded catalog, live enrichment, V4 direct-install export, and mirror sync.

DEPLOYMENT
1. Extract this ZIP into the repository root and overwrite index.html and sw.js.
2. Keep data/mrkraken-global.ini if it already exists.
3. Commit and push the files.
4. Wait for GitHub Pages to redeploy.
5. Hard-refresh the site. Clear site data once if an older service worker remains.
6. Open Language Pack Lab and press Sync recommended pack.
7. Search the selector for “Teach”. MOLE and Golem should show exact synchronized keys.

PROSPECTOR NOTE
If Prospector Teach’s Special is visible but the preview warns that its key is absent, that is an
upstream game-data limitation, not a fuzzy-match failure. V7 deliberately refuses to rename the
standard Prospector as the Teach edition.
