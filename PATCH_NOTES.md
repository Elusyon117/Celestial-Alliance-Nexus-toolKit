# Celestial Nexus Toolkit v2.0.5 — SCMDB Source-Parity Faction Hotfix

This update fixes the remaining Contract Finder faction failures seen after v2.0.4, especially missions that should belong to **Foxwell Enforcement, Headhunters, Vaughn, and other reputation factions** but were still being grouped under `No faction listed`.

## Actual root cause

The missing names were not only a browser-formatting problem. Some extracted Star Citizen faction records use a placeholder at the obvious top-level name field:

```text
Name: <= UNINITIALIZED =>
```

while the usable player-facing faction name is stored deeper in the same faction record at:

```text
Reputation.DisplayName
```

A contract can therefore contain a valid faction UUID while both `Faction.Name` and `ReputationGained[].Faction` look uninitialized. v2.0.4 treated those placeholder values as unusable, but it did not complete the UUID → raw faction record → `Reputation.DisplayName` join. That is why factions such as Foxwell could still disappear.

## SCMDB parity behavior

When SCMDB is reachable, it remains the first-choice authority. The synchronizer preserves its merged mission data and support structures, including:

- `contracts`
- `legacyContracts`
- `factions`
- location, ship, blueprint, availability, reputation, resource, and partial-payout pools
- unknown top-level fields for forward compatibility

The faction relationship is resolved with SCMDB semantics: **contract `factionGuid` → SCMDB faction dictionary entry → readable faction display name**.

## New raw-game relationship fallback

SCMDB is currently returning no usable game-data versions, so v2.0.5 adds a second relationship source based on the same extracted game data family used by Star Citizen Wiki:

- `StarCitizenWiki/scunpacked-data/contracts/*.json`
- `StarCitizenWiki/scunpacked-data/factions/*.json`

The GitHub Actions sync sparse-checks out only the `contracts` and `factions` folders. Current Wiki mission rows are then joined to raw contract records by mission UUID/debug identity. Faction UUIDs are joined to raw faction records.

Faction names are resolved in this order:

1. Explicit SCMDB/browser `factionName`.
2. SCMDB `factionGuid` → complete SCMDB faction dictionary.
3. Raw contract `Faction` relationship.
4. `FactionReputation` / `ReputationGained` relationship.
5. Raw faction UUID → raw faction dictionary → **`Reputation.DisplayName`**.
6. Existing source-supported faction relationship.
7. Mission giver as a last issuer fallback.
8. `Issuer unavailable` only when no source exposes a readable issuer.

Placeholder values such as `<= UNINITIALIZED =>`, `<= PLACEHOLDER =>`, `Undefined Name`, localization placeholders, and opaque GUIDs are never displayed as faction names.

## Contract Finder UI changes

The v2.0.5 browser patch:

- understands raw ScDataDumper faction records;
- reads `Reputation.DisplayName` before accepting a top-level placeholder name;
- resolves SCMDB faction GUIDs through the synchronized faction dictionary;
- removes `No faction listed`, `Unspecified faction`, and other sentinel labels from the Faction/Giver picker;
- rebuilds faction filters after a new synchronized payload is applied;
- never exposes a raw GUID as a user-facing faction.

## Workflow changes

`Sync game data` now attempts sources in this order:

1. exact SCMDB selected LIVE dataset;
2. configured SCMDB mirror(s), if supplied;
3. complete current Star Citizen Wiki mission catalog enriched by the ScDataDumper `contracts` + `factions` relationship mirror;
4. Wiki-only relationship fallback;
5. a previously saved snapshot only if that snapshot is already large enough and faction-complete enough to be trusted.

The workflow summary reports contract count, named-faction count, unresolved issuer count, source, game version, and ScDataDumper relationship-match telemetry.

## Validation

The regression suite now includes the real failure shape: a contract and faction whose top-level names are `<= UNINITIALIZED =>` while the real name exists only at `Reputation.DisplayName`. It verifies recovery of **Headhunters, Foxwell Enforcement, and Vaughn** through UUID joins.

The post-sync validator also treats placeholder names as unresolved, so a broken snapshot can no longer pass merely because it contains the literal text `<= UNINITIALIZED =>`.

## Cache/deployment

Service-worker cache revision: `scmdb-source-parity-v4-20260907`.
