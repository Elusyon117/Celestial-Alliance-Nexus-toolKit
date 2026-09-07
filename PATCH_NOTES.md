# Celestial Nexus Toolkit v2.0.2 — Data Resilience & Contract Identity Fix

## Root causes found

### 1. Wikelo catalog was being deliberately blanked

The uploaded v2.0.1 HTML contained a late "LIVE standardization" override that copied the existing Wikelo recipe rows to legacy fields and then immediately set `trade.materials=[]` and `trade.rewards=[]`. It repeated that clearing behavior when a live mission could not be matched or when the current API did not expose recipe fields.

That made a valid 62-trade curated catalog (269 material requirement lines) appear empty even though the source data was still embedded earlier in the file.

### 2. Contract Finder could render faction GUIDs directly

The final Contract Finder faction formatter accepted `factionGuid` as a display fallback. If SCMDB had not already enriched that GUID into a faction object/name, the raw identifier became the visible faction label and filter option.

### 3. The repository mission snapshot is a zero-row bootstrap

The repository's checked-in mission snapshot currently contains zero missions. The prior synchronization logic could treat an existing snapshot as preservable during a temporary SCMDB failure without requiring it to contain a usable number of missions. That is unsafe for a bootstrap/empty file.

### 4. SCMDB can be temporarily unavailable

The repository already records sync failures. Depending on only SCMDB means a transient 403/outage can prevent the local snapshot from becoming populated even when another current mission source is available.

## Changes in this patch

### Wikelo

- Removed the destructive late override that blanked recipe/reward arrays.
- Added a provenance-aware data-resilience layer.
- Keeps curated community recipes available when a current source omits recipe fields.
- Checks the repository SCMDB snapshot for richer Wikelo mission/objective information.
- Cross-checks current mission metadata/REP with the version-pinned Star Citizen Wiki mission API.
- Replaces a recipe only when a source actually exposes usable material requirements.
- Restored Material Locker readiness and Org Project Plan calculations for retained recipes.
- Adds an in-module source line showing the SCMDB → Wiki cross-check order.

### Contract Finder

- Added faction dictionary capture from SCMDB payloads.
- Resolves faction GUID/UUID values through the dictionary before rendering.
- Prefers readable nested/name fields over identifiers.
- Hides unresolved opaque identifiers as `Unspecified faction`.
- Adds an asynchronous Star Citizen Wiki faction-name enrichment fallback for unresolved GUIDs.
- The sync script now preserves the SCMDB faction dictionary in generated snapshots.

### Data synchronization

New authority order:

1. Newest matching SCMDB dataset.
2. Current Star Citizen Wiki mission dataset for the selected channel/build.
3. A previously saved snapshot only if it contains at least the minimum usable mission count.

A zero-row bootstrap is no longer accepted as a successful fallback.

### Workflow / deployment reliability

- Added pre-sync HTML/JS integrity validation.
- Added deterministic offline regression tests.
- Added post-sync snapshot validation.
- Workflow reports when the Wiki fallback is active instead of treating a populated fallback as total failure.
- Service worker cache version bumped so deployed clients receive the repaired HTML/data behavior.

## No fabricated current mission snapshot is included

The patch does not ship a hand-made `data/scmdb-missions-live.json`. The workflow must generate the actual current snapshot from a real upstream source. Browser-side Contract Finder already retains a live Wiki fallback while the repository snapshot is being populated.
