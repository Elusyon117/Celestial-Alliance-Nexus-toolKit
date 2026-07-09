# Celestial Nexus Toolkit repository update

This package builds on the optimized/clean toolkit and includes the latest fixes requested in chat.

## Included fixes

- Cargo Hauling Routing: `Cargo Transfer from Shuttered Facility` contracts now use the generic `Onyx Facility` origin instead of incorrectly forcing `HDMS-Bezdek`.
- Cargo Hauling Routing: added a local real Onyx Facility Site-B image at `assets/images/locations/onyx-site-b-primary-building.webp` and wired Onyx route cards to use that local file first.
- Cargo Hauling Routing: expanded the built-in ship selector fallback list so the module is not limited to only a small group of cargo ships when live vehicle data is unavailable.
- Hub: the visible Organization Roster panel is hidden from the main page, while the roster data/sync logic remains available for Event Planner participant selection.
- Hub: the creator section now occupies the rail space where the roster used to be visible.
- Event Planner: Gladius Pirate continues to use the same real local artwork file used by the VLM mapping: `assets/images/ships/gladius-pirate-isometric.webp`.
- Layout/scrolling: added stronger scroll-performance CSS, removed fixed background attachment, and pauses paint-heavy shadows/filters while scrolling.
- Preserved previous fixes: module color identities, smooth hub card pointer motion, cleaned module banners/backgrounds, real ship artwork behavior, and Blueprint Finder selected-stat matching.

## Upload instructions

1. Extract this ZIP.
2. Copy everything into the repository root.
3. Replace existing files when prompted.
4. Make sure `assets/images/ships/catalog/` is deleted if it still exists from the earlier placeholder package.
5. Commit and push with GitHub Desktop or git.

Suggested commit message:

```text
Fix cargo Onyx routing, local Onyx image, roster layout, and scrolling
```
