# Celestial Alliance Nexus Toolkit v1.8.0

A browser-based Star Citizen alliance operations toolkit maintained by Elusyon.

This is the **clean replacement package** produced after a repository, workflow, static-code, asset, and performance review. It keeps the current all-in-one browser toolkit while removing repository clutter and hardening the generated-data workflows.

## Clean installation

1. Keep the repository’s `.git` folder.
2. Delete every other file and folder in the working tree.
3. Extract this package into the repository root.
4. Commit and push to `main`.
5. In GitHub Actions, run **Validate toolkit**.
6. Populate generated data:
   - Run **Import SCMDB 4.9 from release asset** after creating the required temporary release asset.
   - Run **Sync MrKraken language pack**.
7. Wait for GitHub Pages to redeploy, then hard-refresh the site once so v1.8.0 replaces older service-worker caches.

Detailed instructions are in [INSTALL.md](INSTALL.md) and [docs/SCMDB_4_9_IMPORT.md](docs/SCMDB_4_9_IMPORT.md).

## Included modules reviewed

- Operations hub
- Flight Profile Builder
- Commodity Trading
- Organization Studio
- Contract Finder / SCMDB mission intelligence
- Wikelo tracking
- Vehicle Loadout Manager
- Vehicle Health
- Item Finder
- Blueprint Finder
- Language Lab / MrKraken mirror
- Mining Resources Command
- Event Planner
- Cargo Hauling Routing

## v1.8.0 reliability changes

- Correct v1.8.0 version metadata and visible release stamp.
- Duplicate DOM IDs removed.
- Extracted 28 embedded image payloads into local assets, reducing the main HTML by about 44%.
- Low-risk image decoding/lazy-loading hardening.
- Runtime diagnostics exposed as `window.NEXUS_DIAGNOSTICS`.
- Service worker upgraded to resilient per-file precaching, so one missing optional asset cannot block installation.
- Versioned caches and cleanup of older Nexus cache generations.
- Robust SCMDB direct-file importer with strict identity and record-count validation.
- Clear SCMDB release/asset preflight errors and non-destructive workflow cleanup.
- SCMDB scheduled sync preserves the last valid snapshot when the public endpoint returns a temporary 403/5xx.
- MrKraken sync upgraded to current GitHub Actions and stronger release validation.
- Repository validation workflow added.
- Local asset reference added for Monde Crimson.

## Generated data

The clean ZIP contains safe bootstrap data rather than fabricated third-party mission or localization records. The workflows populate the full tracked mirrors after deployment. See [data/README.md](data/README.md).

## Audit

See [AUDIT_REPORT.md](AUDIT_REPORT.md) for the complete findings, limitations, fixes, and validation results.
