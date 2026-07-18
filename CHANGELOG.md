# Changelog

## 1.8.0 — 2026-07-18

### Fixed

- SCMDB release-asset importer now fails fast with clear release/asset instructions.
- Cleanup of the temporary release no longer invalidates a successful import.
- Direct SCMDB file imports validate JSON, patch, channel, mission structure, and minimum counts.
- Scheduled SCMDB sync preserves the last valid tracked snapshot during temporary upstream failures.
- Duplicate DOM IDs in Blueprint Finder visual patches.
- Version metadata and release labels that still reported 1.6.0.
- Service-worker installation could fail entirely when one optional precache asset was unavailable.
- Missing local Monde Crimson reference image.
- MrKraken workflow action versions and validation.

### Added

- Repository validation workflow and local validation script.
- Runtime diagnostic object and readiness event.
- Patch/data consistency audit.
- Clean replacement and migration documentation.

### Performance

- Extracted 28 base64 image payloads from the monolithic HTML into local cached assets.
- Reduced `index.html` from about 6.45 MB to about 3.60 MB.
- Hidden module paint containment.
- Asynchronous image decoding and conservative lazy loading.
- Resilient versioned caching and stale-cache cleanup.
