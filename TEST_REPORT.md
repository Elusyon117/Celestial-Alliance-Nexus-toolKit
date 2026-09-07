# Celestial Nexus Toolkit v2.0.5 — Test Report

## Static repository validation

PASS

- Toolkit version: `2.0.5`.
- **166** inline JavaScript blocks compiled successfully.
- **613** DOM IDs inspected with no duplicate IDs.
- **146** unique functions referenced by inline UI handlers resolve.
- Shipped Node scripts pass `node --check`.
- Required data-resilience, SCMDB parity, faction relationship, workflow, and validator components are present.

## Wikelo regression

PASS

- Community recipe data remains available when a live mission API omits recipe fields.
- Inventory readiness and org project-plan math continue to use retained recipe requirements.
- The removed per-card recipe provenance message is not reinserted.

## Browser SCMDB / faction-source regression

PASS

The v2.0.5 browser resolver was executed in a VM fixture and verified:

- `factionGuid` resolves through the synchronized faction dictionary.
- A faction dictionary entry with `Name: <= UNINITIALIZED =>` resolves through nested `Reputation.DisplayName`.
- `FactionReputation` resolves Vaughn-style reputation relationships.
- mission-giver fallback remains available where no faction relationship exists.
- opaque UUIDs never become visible faction names.
- `No faction listed` is removed from the Faction/Giver selector.

## SCMDB exact-schema fixture

PASS

- 120 current contracts + 20 legacy contracts = **140 searchable contracts**.
- SCMDB faction GUIDs resolve through the SCMDB faction dictionary.
- Location, ship, blueprint, availability, reputation/resource/partial-payout structures remain preserved.
- Unknown SCMDB top-level metadata is preserved for forward compatibility.

## Wiki fallback fixture

PASS

- A forced SCMDB failure generated a usable current Wiki fallback.
- Faction names derived from reputation relationships rather than requiring a direct faction object.
- Fixture unresolved-faction count: **0**.

## ScDataDumper UUID relationship fixture

PASS

This fixture reproduces the real placeholder-name failure shape:

- raw contracts contain `Faction.Name: <= UNINITIALIZED =>`;
- `ReputationGained[].Faction` is also `<= UNINITIALIZED =>`;
- raw faction dictionary records contain the real name only at `Reputation.DisplayName`.

The synchronizer successfully recovered:

- **Headhunters**
- **Foxwell Enforcement**
- **Vaughn**

using mission UUID → raw contract → faction UUID → raw faction dictionary joins. The fixture reports at least three mission matches, at least three faction matches, and **0 unresolved faction rows**.

## Pagination / completeness regression

PASS

The browser paging fixture still verifies that a 450-row API split across 200 + 200 + 50 rows loads all **450** records instead of silently stopping after the first page.

## Validator regression

PASS

The post-sync validator now treats all of the following as unresolved rather than valid names:

- `<= UNINITIALIZED =>`
- `<= PLACEHOLDER =>`
- `Undefined Name`
- localization placeholder names
- opaque GUID/UUID values

It also understands nested `Reputation.DisplayName`, matching the production resolver.

## Latest local test commands

```text
node --check scripts/sync-scmdb-missions.mjs
node --check scripts/test-data-resilience.mjs
node --check scripts/validate-toolkit.mjs
node --check scripts/validate-repo.mjs
node scripts/validate-repo.mjs
node scripts/validate-toolkit.mjs --pre-sync
node scripts/test-data-resilience.mjs
```

All passed before packaging.
