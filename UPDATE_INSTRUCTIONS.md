# Update Instructions — Celestial Nexus Toolkit v2.0.4

## 1. Apply the overlay

Extract the ZIP and copy its contents over the **root of the GitHub repository**. Preserve the folder structure, including the hidden `.github` directory.

The update intentionally replaces:

- `index.html`
- `sw.js`
- `.github/workflows/sync-game-data.yml`
- `.github/workflows/validate-toolkit.yml`
- the scripts under `scripts/` included in the ZIP

Commit and push those files to `main`.

## 2. Run validation

In **GitHub → Actions**, manually run **CA Toolkit V 2.0.4**.

The validation job should pass the repository checks, pre-sync toolkit checks, and data-resilience/faction regression suite.

## 3. Regenerate Contract Finder data

Manually run **Sync game data** after validation passes.

In the workflow summary, check:

- Version
- Source
- Status
- Contracts
- Named factions
- **Contracts without a resolved faction/issuer**

If SCMDB is currently reachable, the source should return to SCMDB automatically. If SCMDB is unavailable, the current-version Wiki fallback is acceptable, but the unresolved faction/issuer count should no longer represent a large portion of the catalog.

## 4. Deploy and refresh

Wait for your normal GitHub Pages deployment to complete. Then hard-refresh the toolkit once. The v2.0.4 service-worker cache revision forces replacement of v2.0.3 cached assets.

The browser also has a relationship-enrichment fallback. If a repository snapshot still contains a few unresolved summary rows, Contract Finder can resolve them from the current faction collection and Wiki faction-filter membership and cache that mapping per game build.

## 5. What to verify in Contract Finder

Open **Contract Finder → Faction / Giver** and confirm that the previous large `Unspecified faction` bucket is gone.

For example, generic Headhunters mission families such as `[DESTINATION] Errand` and `[LOCATION] needs some repairs` should resolve as Headhunters when that relationship exists in the source data.

A record may display `No faction listed` only when all available source relationships are genuinely absent. Raw GUIDs should never be displayed as faction names.
