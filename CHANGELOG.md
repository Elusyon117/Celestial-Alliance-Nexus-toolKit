# Changelog

## Celestial Nexus Toolkit v1.6.0 — 2026-07-08

### Added

- SCMDB-style color-coded Contract Finder tags for illegal/legal state, contract category, system/region, combat, hauling, shareable, blueprints, released/unreleased, and chain indicators.
- Redesigned Contract Finder detail board with KPI cards, requirements, calculator inputs, combat breakdown, cargo manifest, locations, operations, rewards, and raw source fields.
- v1.6.0 repository docs, manifest metadata, service-worker cache version, checksum file, package report, patch report, upload instructions, and cleanup guide.

### Changed

- Cargo Hauling contract picker now uses the contract title as the primary display name and moves payout/mission metadata into secondary fields.
- Module navigation now keeps module pages focused with a single Hub button in the top-right area while preserving Discord access.
- Contract data rendering now degrades gracefully when SCMDB/source records do not publish a calculator field, combat encounter, cargo SCU amount, or requirement.

### Fixed

- Fixed confusing Cargo Hauling contract rows where payout or mission IDs appeared as the selected contract name.
- Reduced ambiguity in Contract Finder detail cards by separating reward, reputation, duration, legality, source state, and preserved raw data.
- Updated app-level release stamping from older 1.5.x labels to v1.6.0.

## Earlier releases

Historical v1.3.x–v1.5.x patch notes may exist in older repository files. Once v1.6.0 is verified in production, old one-off upload notes and generated patch artifacts can be archived or removed.
