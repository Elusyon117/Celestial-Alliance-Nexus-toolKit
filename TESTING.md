# Testing guide

## Automated checks

Run locally with Node 24 or in GitHub Actions:

```bash
node scripts/validate-repo.mjs
node --check scripts/sync-scmdb-missions.mjs
node --check scripts/audit-patch-data.mjs
```

After SCMDB data is populated:

```bash
STRICT_AUDIT=1 node scripts/audit-patch-data.mjs
```

## Browser smoke test

Test the GitHub Pages deployment in current Chrome or Edge:

1. Open the hub and confirm v1.8.0 appears.
2. Open every module from the hub.
3. Return to the hub after each module.
4. Confirm no module overlays another and hidden views remain hidden.
5. Check the browser console for unhandled errors.
6. Inspect `window.NEXUS_DIAGNOSTICS`.
7. Reload offline once after the first successful online load.

## Feature checks

- Contract Finder shows a verified 4.9.0 LIVE data source and a nonzero contract count.
- Blueprint contract links open the matching Contract Finder result.
- Language Lab reports a complete repository mirror with at least 10,000 entries.
- Cargo Transfer from Shuttered Facility resolves to Onyx Facility.
- Tactical Strike Groups loads its local bundled visual.
- Wikelo cards display local artwork, including Monde Crimson.
- Event Planner can access the roster snapshot.
- Cargo and commodity ship selectors remain usable without duplicate manufacturer prefixes.
- Flight Profile export and preview actions complete without layout corruption.

## Performance checks

In DevTools Performance:

- Record hub idle for 10 seconds. Hidden views should not paint.
- Navigate across all modules and watch detached nodes/heap growth.
- Confirm images below the fold use lazy loading.
- Verify the service worker installs even if one optional asset is temporarily unavailable.
- Confirm a second load uses cached local artwork and shell files.
