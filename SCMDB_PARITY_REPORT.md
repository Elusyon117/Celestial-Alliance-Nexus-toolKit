# SCMDB Source / Faction Parity Report — v2.0.5

## What was investigated

The remaining symptom was a faction chooser with only a small set of names while current mission data contained many more contracts. The important distinction is that **mission count**, **faction dictionary completeness**, and **mission-to-faction relationship completeness** are three separate things.

A large mission list can still produce only a handful of faction choices if the join between mission `factionGuid` / faction UUID and the faction dictionary is missing or if the dictionary's obvious `Name` field contains an extraction placeholder.

## SCMDB model replicated

When SCMDB is available, v2.0.5 copies the SCMDB dataset rather than inventing a reduced replacement schema. It merges:

```text
contracts + legacyContracts
```

and preserves the SCMDB `factions` dictionary and support pools. For each contract, `factionGuid` is resolved through that dictionary before Contract Finder builds the faction picker.

This is the same relationship model expected by clients that consume SCMDB mission data: mission records contain faction references and a separate faction dataset supplies the readable faction information.

## Why Foxwell / Headhunters / Vaughn were still disappearing

The raw game-data representation exposed an additional edge case. Some reputation-faction JSON records have:

```text
Name = <= UNINITIALIZED =>
```

but contain the real user-facing name at:

```text
Reputation.DisplayName
```

So resolving only `Faction.Name` is insufficient even after the UUID relationship is known. v2.0.5 resolves the UUID into the complete faction record and then checks nested reputation display fields before falling back to top-level names.

This fixes the extraction pattern used by factions such as Foxwell Enforcement and protects the same class of issue for Headhunters, Vaughn, and future reputation factions.

## Current upstream condition

As of this update, the public SCMDB site reports that no game-data versions can be loaded. Because of that outage, an exact current SCMDB mission total cannot be truthfully regenerated from SCMDB at build time today.

For comparison only, the public SC Toolbox project describes its SCMDB-backed Mission Database as containing **1,381 missions**. That is a useful completeness warning signal, not a hard-coded target: SCMDB's real count can change with patches and its service is currently unavailable.

v2.0.5 therefore does **not** fabricate rows or freeze the application to 1,381. When SCMDB becomes healthy, exact SCMDB data automatically takes priority again.

## Degraded-source relationship mirror

While SCMDB is unavailable, the workflow obtains a complete current mission list from Star Citizen Wiki and sparse-checks out `StarCitizenWiki/scunpacked-data` relationship data:

```text
contracts/
factions/
```

The synchronizer joins Wiki mission UUIDs to raw contracts, then joins faction UUIDs to raw faction records. This is intentionally relationship enrichment, not a claim that the Wiki JSON schema equals SCMDB's schema.

The resulting fallback records source telemetry for:

- raw contract files loaded;
- raw faction files loaded;
- mission UUID/debug matches;
- faction dictionary matches;
- named factions;
- unresolved faction/issuer rows.

## Acceptance rules

A synchronized dataset is accepted only if it satisfies the toolkit's data-quality rules:

- SCMDB: current and legacy contract sets must be internally consistent and support dictionaries must be preserved.
- Wiki fallback: the mission collection must be large enough to represent the complete ungrouped catalog rather than a single page.
- Placeholder names such as `<= UNINITIALIZED =>` do not count as resolved factions.
- Raw GUIDs do not count as readable names.
- A heavily unresolved fallback is rejected rather than deployed as a seemingly healthy Contract Finder.

## Expected UI result

After v2.0.5 synchronization, the faction picker is built from actual resolved source relationships. Factions such as **Foxwell Enforcement, Headhunters, Vaughn**, and other faction/reputation issuers present in the current source data can appear as normal choices. Sentinel buckets such as `No faction listed` are not offered as faction choices.
