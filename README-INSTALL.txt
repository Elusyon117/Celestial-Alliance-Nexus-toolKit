CELESTIAL NEXUS LANGUAGE LAB — COMPLETE SHIPS & EDITIONS V6

This update replaces the fixed-only ASOP selector with a localization-driven catalog.

Repository files to replace/add:
  index.html
  sw.js
  .github/workflows/sync-mrkraken-language-pack.yml
  data/mrkraken-release.json

Keep the generated data/mrkraken-global.ini already created by the GitHub Action.
If it is missing, run the “Sync MrKraken language pack” workflow once.

COMPLETE CATALOG FIX
- The embedded ship catalog remains available offline and before synchronization.
- After the recommended pack loads, Language Lab scans every vehicle_Name entry in the current global.ini.
- Special, reward, store, and alternate editions receive their exact localization key.
- Examples include current Teach’s Special entries when present in the synchronized game localization.
- Generic live ship APIs are optional metadata only and cannot remove localization-derived editions.
- Saved rules now retain localizationKey, preventing similarly named editions from resolving to the wrong ASOP entry.
- Manufacturer removal now preserves the original capitalization in exported ASOP names.

IMPORTANT
Only editions with a distinct vehicle_Name localization/ASOP entry can be reordered separately.
Paint-only liveries that share the base hull’s ASOP entry are intentionally not presented as separate resolvable ships.

DEPLOYMENT
1. Extract this ZIP into the repository root and overwrite index.html and sw.js.
2. Commit and push the files.
3. Wait for GitHub Pages to redeploy.
4. Hard-refresh the site. If an older service worker remains, clear site data once.
5. Open Language Pack Lab and press Sync recommended pack.
6. The catalog status will report how many exact ASOP entries were discovered from global.ini.

All V4 direct-install export and V5 offline-catalog fixes are preserved.
