# Celestial Nexus Toolkit v1.9.1-r2

## Performance

- Reduced the self-contained HTML payload by re-encoding and deduplicating embedded artwork.
- Improved hidden-view media and animation suspension.
- Reduced eager image work and batched dynamic-image processing.
- Added a new service-worker cache generation so deployed clients receive the cumulative update.

## Contract Finder

- Moved contract selection into a top catalog and dropdown workflow.
- Expanded contract intelligence to full width.
- Added previous/next contract navigation.
- Separated reputation awarded from reputation required by exact faction and reputation track.
- Added expandable related-contract results for the required reputation track.

## Language Pack Lab

- Audited INI source loading, parsing, merge order, and export generation.
- Updated exact ship-name and short-name handling.
- Added exact localization-key catalog coverage and special-variant auditing.
- Improved component-name schema parsing and output formatting.
- Restored ore-name shortening to the build pipeline.
- Added source freshness and rename-integrity diagnostics.

## Game Status and Intel

- Prioritized official CIG/RSI status, patch notes, Known Issues, Devtracker, Spectrum, and Comm-Link sources.
- Distinguished the Alpha 4.9 release build from its later hotfix build.
- Corrected PTU status to Alpha 4.10 PTU build 12311913.
- Added transparent source and freshness labeling.

## Vehicle Loadout Manager

- Expanded exact vehicle and special-variant catalog handling.
- Improved complete compatible-component discovery and deduplication.
- Added exact-versus-inherited stock-loadout provenance.
- Improved current-patch seller/price filtering and stale-data labeling.
- Added terminal-distance-aware closest-route planning and cheapest-total planning.
- Added vehicle, component, price, and route integrity diagnostics.

## FPS Weapon Loadout Manager

- Replaced heuristic-first stat extraction with current schema-first extraction.
- Prevented missing data from being shown as zero.
- Improved exact attachment-port and compatibility handling.
- Added exact blueprint output matching, ingredients, unlocks, craft time, and quality fields.
- Improved weapon-artwork discovery and verified fallback behavior.
- Added selected-weapon integrity diagnostics.

## Compatibility

- Existing relative asset and generated-data paths are preserved.
- Existing browser storage keys are preserved.
- The application remains a self-contained `index.html` backed by the repository's existing assets and data files.
