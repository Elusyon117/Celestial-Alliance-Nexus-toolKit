# SCMDB / Faction Parity Report — v2.0.4

## Authority model

Contract Finder continues to prefer SCMDB. When SCMDB is healthy, the sync mirrors SCMDB's current `contracts` and `legacyContracts` mission sets and retains its supporting faction, location, ship, blueprint, availability, resource, reputation, and partial-payout structures.

The Star Citizen Wiki API is a degraded-source fallback only. It is version-pinned to the current LIVE build discovered by the workflow and is not presented as exact SCMDB schema parity.

## Faction parity problem fixed in v2.0.4

The v2.0.3 fallback could contain hundreds of current contracts but still show many `Unspecified faction` rows. The issue was not simply a missing faction-name dictionary. The missing piece was the **mission → faction relationship** for compact mission-summary records.

v2.0.4 now reconstructs that relationship using multiple source-supported paths. It first consumes direct faction fields and `FactionReputation`, then GUID dictionaries, then the Wiki mission endpoint's faction filter membership. This lets the fallback associate a mission UUID with the faction that the API itself uses when filtering the mission catalog.

A critical reputation rule is included: `FactionReputation` wins over `Affinity`. This prevents secondary affinity awards from being mistaken for the mission issuer.

## Completeness telemetry

Every synchronized fallback records:

- total mission count,
- named faction count,
- unresolved faction/issuer row count,
- faction dictionary count,
- relationship-assignment method,
- number of faction-filter queries performed.

The GitHub Actions summary exposes the unresolved count after each sync.

## Acceptance rules

- SCMDB snapshots must preserve current + legacy mission parity and support dictionaries.
- Wiki fallback must contain at least the configured minimum mission total.
- A Wiki fallback with more than 10% unresolved faction/issuer rows (minimum threshold 25) is rejected by post-sync validation.
- Raw GUIDs are never promoted to human-readable faction names.

## Expected result

After applying v2.0.4 and running **Sync game data**, generic missions that genuinely belong to factions should appear under those factions instead of collecting under `Unspecified faction`. A small number of `No faction listed` rows may remain only when the source itself exposes no faction, issuer, reputation relationship, or faction-filter membership for that mission.
