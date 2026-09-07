# SCMDB Parity Report — v2.0.3

## Why the previous faction list was too small

The 13-option faction picker shown after v2.0.2 was no longer displaying raw GUIDs, but it was still being populated from an incomplete mission snapshot. A readable faction formatter cannot create factions that were never loaded.

The previous Wiki fallback could terminate after a single API page depending on pagination metadata shape. A small mission snapshot therefore produced a correspondingly small faction list.

## What v2.0.3 changes

### Mission quantity semantics

When SCMDB is available, the synchronized Contract Finder dataset is the union of:

- `contracts`
- `legacyContracts`

Both sets remain individually counted in snapshot metadata, while all rows are available to the finder. A public SCMDB-backed SC Toolbox build currently describes its Mission Database as a browser for 1,381 missions. This is an informational benchmark, not a hard-coded target. As of 2026-09-07, the current Star Citizen Wiki mission API reports 1,786 ungrouped/current API mission rows across 60 default pages; this is a different source/schema, so its total is a completeness cross-check rather than an SCMDB parity target.

### Data preservation

For SCMDB synchronization, v2.0.3 keeps the complete raw mission records and preserves the supporting lookup/pool dictionaries needed to interpret them:

`factions`, `locationPools`, `shipPools`, `blueprintPools`, `scopes`, `availabilityPools`, `factionRewardsPools`, `resourcePools`, and `partialRewardPayoutPools`.

Unknown extra SCMDB top-level keys are retained under `sourceExtras` so a future schema addition is not silently discarded.

### Faction parity

Faction names resolve from `factions[factionGuid]` before display. The generated snapshot reports:

- total merged contracts
- active-contract count
- legacy-contract count
- faction dictionary count
- named faction count

The browser also reports loaded contract/faction counts in the Contract Finder status line.

### Upstream outage behavior

SCMDB's public data service is currently unreliable, so an exact fresh SCMDB payload cannot safely be bundled from the live service at packaging time. Instead of inventing missing rows, the workflow now falls back to the **complete current-version Star Citizen Wiki mission catalog** and keeps paging until exhaustion. A small partial fallback is rejected.

When SCMDB is reachable again, the next scheduled/manual sync automatically returns to SCMDB as the primary source and regenerates the snapshot with exact current SCMDB semantics.

## Regression fixtures

The v2.0.3 automated tests verify:

- 120 active SCMDB contracts + 20 legacy contracts produce 140 searchable rows.
- 30 faction dictionary entries remain 30 named factions after enrichment.
- supporting SCMDB pools survive snapshot generation.
- a simulated 450-row Wiki API split across 200 + 200 + 50 rows is loaded completely by the browser fallback.
- an offline Wikelo recipe stays usable without the removed provenance box.
