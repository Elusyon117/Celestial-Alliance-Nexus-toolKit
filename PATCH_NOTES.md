# Celestial Nexus Toolkit v2.0.4 — Faction Relationship Resolution

This hotfix addresses the remaining **“Unspecified faction”** entries in Contract Finder while preserving the v2.0.3 Wikelo, SCMDB-parity, and workflow repairs.

## Root cause

v2.0.3 correctly stopped raw faction GUIDs from being shown as names and loaded a faction dictionary. However, a dictionary only answers **“what name belongs to this faction ID?”**. It does not answer **“which faction owns this mission?”** when a mission-summary row omits the expanded faction relationship.

That is the case behind the screenshot: generic contracts such as `[DESTINATION] Errand`, `[LOCATION] needs some repairs`, and `[TARGET] needs stomping` can have a real issuer/faction in the full mission data while the compact list record used by the browser may not carry a directly readable `faction.name`.

## Contract Finder changes

The new `nexus-v204-faction-parity-patch` resolves a contract issuer/faction in this order:

1. Expanded faction fields, including lower-case and extracted-game-data forms such as `faction.name`, `Faction.Name`, `FactionName`, and organization fields.
2. Reputation records. `FactionReputation` is deliberately preferred over unrelated `Affinity` awards, so a Headhunters mission that also grants Citizens For Prosperity affinity remains a **Headhunters** contract.
3. Faction GUID/UUID lookup through the complete faction dictionary.
4. Mission-to-faction membership learned from the current Star Citizen Wiki mission endpoint using its `filter[faction]` relationship.
5. Mission giver/giver fields as an issuer fallback.
6. Only after all available relationship sources are exhausted is a record labeled `No faction listed`.

Additional browser fixes:

- JSON:API-style `attributes` are flattened before Contract Finder builds filters and cards.
- JSON:API faction relationship IDs are retained and resolved.
- The browser always loads the **complete faction collection**, instead of assuming the handful of already-resolved factions is the full set.
- Mission-to-faction mappings are cached per game build in browser local storage to avoid repeating the enrichment work on every visit.
- The faction filter is rebuilt after enrichment, so newly resolved names appear without requiring a page reload.

## Repository sync changes

When SCMDB is available, exact SCMDB behavior remains the authority: current `contracts + legacyContracts` are preserved with SCMDB support dictionaries and raw fields.

When SCMDB is unavailable and the workflow uses the current Star Citizen Wiki fallback, the sync now enriches every mission using:

- direct faction data,
- `FactionReputation` / reputation records,
- faction GUID dictionaries,
- mission membership returned by `filter[faction]`, and
- mission giver fields.

The generated snapshot now records:

- `factionName` on resolved mission rows,
- `unresolvedFactionCount`,
- named-faction count,
- the relationship-enrichment method, and
- number of faction filters queried.

The Sync game data Actions summary also reports **Contracts without a resolved faction/issuer** so this regression is visible immediately rather than only in the UI.

## Validation changes

Post-sync validation now fails a Wiki fallback if more than 10% of rows (or more than 25 rows, whichever is larger) still lack a readable faction/issuer. This prevents another apparently-populated Contract Finder snapshot from being accepted when the relationship layer is mostly missing.

## Cache/deployment

The service-worker cache namespace is now `faction-parity-v3-20260907`, forcing deployed clients to replace the older v2.0.3 HTML/data-loader assets.
