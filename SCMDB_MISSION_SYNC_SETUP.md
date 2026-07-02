# SCMDB Mission Finder synchronization

Mission Finder reads `data/scmdb-missions-live.json` and preserves every field in each source record. The companion JavaScript file supports standalone/offline preview mode.

## Automatic discovery

The workflow `.github/workflows/sync-scmdb-missions.yml` runs daily and can be launched manually from **Actions → Sync SCMDB mission data → Run workflow**. Its discovery script scans SCMDB's public HTML, JavaScript and JSON references for the largest mission/contract collection.

## Exact endpoint override

SCMDB may change its public data path. When the automatic discovery cannot locate it:

1. Open the repository **Settings → Secrets and variables → Actions → Variables**.
2. Create a repository variable named `SCMDB_MISSIONS_URL`.
3. Set it to SCMDB's current public JSON mission endpoint.
4. Run the sync workflow manually.

The script does not discard fields or reshape mission records. It wraps the original objects in snapshot metadata and the Mission Finder displays both a decision-friendly view and the complete raw record.

## Browser fallback

When no SCMDB snapshot is available, the module attempts a live SCMDB request and then uses the current Star Citizen Wiki mission API as an explicitly labelled fallback. Imported SCMDB JSON can also be loaded directly from the Mission Finder interface.
