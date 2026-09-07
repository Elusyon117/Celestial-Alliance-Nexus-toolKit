# Celestial Nexus Toolkit v2.0.4 — Test Report

## Static repository validation

PASS

- Toolkit version derived as `2.0.4`.
- **165** inline JavaScript blocks compiled successfully.
- **613** DOM IDs inspected; no duplicate IDs detected.
- **146** unique functions referenced by inline UI handlers resolved.
- Required sync, audit, validation, regression, and workflow files are present.
- All shipped `.mjs` scripts pass `node --check`.
- Both GitHub Actions workflow YAML files parse successfully.

## Browser faction regression fixture

PASS

The v2.0.4 browser patch was executed in a VM-backed fixture and verified:

- `Faction.Name` → `Headhunters`.
- A mission with Citizens For Prosperity `Affinity` plus Headhunters `FactionReputation` resolves to **Headhunters**.
- JSON:API `attributes.faction.name` is flattened and resolved.
- A mission with no direct faction is resolved from Wiki `filter[faction]` membership.
- Legacy `Unspecified faction` output is not used by the new resolver.
- Existing v2.0.3 Wikelo recipe retention/readiness/project-plan tests still pass.

## Contract data regression fixtures

PASS

### SCMDB fixture

- 120 current contracts + 20 legacy contracts = **140 searchable contracts**.
- Faction GUIDs resolve through SCMDB's faction dictionary.
- Supporting pools/dictionaries and unknown top-level SCMDB metadata remain preserved.

### Wiki fallback fixture

- **125** current mission rows loaded after a forced SCMDB failure.
- Faction names were derived from `ReputationGained`/`FactionReputation` rather than requiring a direct `faction` object.
- `unresolvedFactionCount` = **0** in the fixture.

### Faction-filter relationship fixture

A local HTTP API fixture was used to simulate summary rows with no faction field at all. The sync queried the faction list and `filter[faction]` mission membership and produced:

- 6 missions,
- 3 named factions,
- **0 unresolved faction rows**,
- correct Headhunters / Citizens For Prosperity / Covalex assignments.

## Wiki pagination regression

PASS

A 450-row browser fixture split across 200 + 200 + 50 rows loaded all **450** missions without stopping early.

## Deployment/cache checks

PASS

- Service-worker cache revision: `faction-parity-v3-20260907`.
- v2.0.4 faction relationship patch is required by CI.
- Post-sync validation rejects a heavily unresolved Wiki fallback.
