# Celestial Nexus Toolkit v2.0.3 — Test Report

## Static repository validation

PASS

- Toolkit version derived as `2.0.3`.
- 164 inline JavaScript blocks compiled successfully.
- 613 DOM IDs inspected; no duplicate IDs detected.
- 146 unique functions referenced by inline UI handlers resolved.
- Required data/workflow scripts present.
- Both GitHub Actions workflow YAML files parse successfully.
- All shipped `.mjs` scripts pass `node --check`.

## Browser/data-resilience regression suite

PASS

Validated in a VM-backed browser fixture:

- known faction GUID resolves to its readable faction name.
- unknown GUID displays `Unspecified faction`, never the raw identifier.
- Wikelo recipe/materials remain available when network mission sources fail.
- Material Locker readiness remains functional.
- Org Project Plan totals remain functional.
- the removed generic `Recipe shown from...` / `Recipe cross-checked from...` message is not reintroduced.
- a 450-mission Wiki catalog split into 200 + 200 + 50 API pages loads all 450 rows.

## SCMDB synchronization fixture

PASS

Fixture contained:

- 120 active `contracts`
- 20 `legacyContracts`
- 30 factions
- representative location, ship, blueprint, scope, availability, faction-reward, resource, and partial-payout pools

Generated result:

- 140 searchable mission rows
- 120 active + 20 legacy parity accounting
- 30 named factions
- all required supporting dictionaries preserved
- original mission fields retained while readable enrichment was added

Post-sync toolkit validation and repository validation both passed against this generated snapshot.

## Wiki outage-fallback fixture

PASS

An intentionally unavailable SCMDB source fell through to a version-pinned Wiki fixture successfully. The test lowers the production minimum only for the fixture; production validation rejects suspiciously small Wiki fallbacks.

## Packaging checks

The final ZIP is generated only after the tests above pass. `unzip -t` and SHA-256 verification are performed during packaging.

## Environment limitation

A full Chromium navigation test cannot be run in this sandbox because local/file navigation is administratively blocked. The update therefore uses JavaScript VM browser fixtures, synchronization fixtures, static DOM/handler validation, workflow YAML parsing, and post-sync repository validation as its automated coverage.
