# Celestial Nexus Toolkit v1.9.1-r3

## Repository integrity

- Added `release.json` as the shared application-version and cache-revision source.
- Corrected the validation script, which previously required `1.9.2` while the application metadata was `1.9.1`.
- Corrected the patch-audit version expression, which could not accept the current version.
- Replaced the broad historical-patch warning with a check that the current detected patch is represented.
- Stabilized the PWA manifest `id` and aligned icon cache tags with application version `1.9.1`.

## Vehicle Loadout Manager

- Component pickers now open immediately with current stock and cached choices.
- Replaced the unbounded size-only enrichment path with bounded type-and-size requests.
- Added limited request concurrency, per-request timeouts, and a total refresh timeout.
- Failed or empty refreshes are not cached as successful complete catalogs.
- Existing choices remain usable when the live API is slow, blocked, unavailable, or returns an invalid payload.
- Added `window.nexusLoadoutClearComponentCatalogCache()` for explicit in-session retry/reset diagnostics.
- Added `window.NEXUS_VLM_INTEGRITY_HOTFIX` diagnostics with the active hotfix version and catalog cache.

## Cache lifecycle

- Updated the service-worker revision from `1.9.1-r2` to `1.9.1-r3`.
- Added `release.json` to the resilient shell precache.
- Existing storage keys, generated-data paths, assets, and module routes remain unchanged.

## Compatibility

- Visible application version remains `1.9.1`.
- No generated mission, roster, localization, price, or status data is replaced by this overlay.
