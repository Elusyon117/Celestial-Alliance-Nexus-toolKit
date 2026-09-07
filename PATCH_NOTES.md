# Celestial Nexus Toolkit v2.0.3 — SCMDB Parity & Workflow Repair

This overlay updates the v2.0.2 data-resilience repair with a full Contract Finder / SCMDB parity pass and CI fixes.

## Wikelo Trade Center

- Removed the yellow per-card recipe provenance box (the "Recipe shown from Community catalog snapshot..." message).
- The module still keeps the embedded Wikelo recipes available when a live mission API omits recipe fields.
- Legitimate trade-specific notes from the curated catalog are preserved; only the generic provenance/status notice was removed.
- Material Locker readiness and Org Project Plan calculations continue to use the retained recipe data.

## Contract Finder — SCMDB parity

- SCMDB ingestion now follows SCMDB mission-view semantics: `contracts + legacyContracts` are merged into the searchable mission list.
- Every original mission object is retained. Enrichment adds readable/display fields without deleting raw SCMDB fields.
- The synchronized snapshot also preserves SCMDB supporting datasets used by mission records:
  - `factions`
  - `locationPools`
  - `shipPools`
  - `blueprintPools`
  - `scopes`
  - `availabilityPools`
  - `factionRewardsPools`
  - `resourcePools`
  - `partialRewardPayoutPools`
- Unknown additional SCMDB top-level sections are retained under `sourceExtras` rather than discarded.
- Faction GUIDs resolve through the SCMDB faction dictionary before display. Unresolved opaque IDs are never shown as faction names.
- The Contract Finder status line now reports the loaded contract count and named-faction count; SCMDB parity telemetry is included when the active source is SCMDB.

## Complete fallback loading

- The browser Star Citizen Wiki fallback no longer stops after the first API page. It keeps loading pages until the current-version mission catalog is exhausted.
- The repository sync performs the same full pagination and rejects suspiciously tiny Wiki snapshots instead of treating them as a complete database.
- Source order is now:
  1. SCMDB
  2. configured SCMDB mirrors
  3. full current-version Star Citizen Wiki mission catalog
  4. previously checked-in snapshot, only if it is already usable
- A zero-row/bootstrap snapshot can no longer be preserved as a successful fallback.

## GitHub Actions / workflow repair

- Replaced the version-fragile repository validator with a validator that derives the toolkit version from `index.html`.
- Added a self-contained v2.0.3 validation workflow using Node.js only; it does not depend on an undeclared Python YAML package.
- The game-data workflow now validates scripts before sync, validates the synchronized snapshot afterward, runs regression tests, and reports contract/faction totals in the job summary.
- SCMDB downtime now degrades to a full Wiki fallback instead of causing the toolkit to publish a tiny/empty Contract Finder dataset.
- `scripts/audit-patch-data.mjs` is included in the overlay, so the sync workflow no longer references a missing/brittle repository helper.

## Cache update

- Service-worker cache namespace bumped to `scmdb-parity-v2-20260907`, forcing deployed clients to refresh the repaired HTML/data loader.

## SCMDB reference quantity

A current public SCMDB-backed SC Toolbox project advertises a mission browser containing 1,381 missions. The current Star Citizen Wiki mission API reports 1,786 rows (60 default pages) for its own mission schema. These totals are used only as completeness/parity benchmarks because the two sources do not have identical semantics and SCMDB can change between patches; SCMDB's public data endpoint is presently unreliable. v2.0.3 does **not** fabricate rows to hit 1,381; when SCMDB is reachable it mirrors SCMDB's current `contracts + legacyContracts` data and supporting dictionaries directly.
