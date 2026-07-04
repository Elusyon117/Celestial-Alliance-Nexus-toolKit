# Patch changelog — 2026-07-04

## Celestial Nexus Toolkit v1.5.2 — Item Finder safe category patch

Updated root `index.html` with the latest stable toolkit version from the working local HTML file.

Included fixes from the working build:

- Item Finder duplicate cleanup and stable item IDs.
- Item Finder source cross-checking to avoid mismatched wiki/artwork/details.
- Safe category alignment for armor parts such as helmet, core, arms, legs, backpack, gloves, boots, and full sets.
- Full-set image filtering so part-specific images are rejected for full-set records.
- VLM restored/correct hardpoint parsing from the previously working version.
- VLM not-buyable acquisition label.
- VLM blueprint links in the shopping list right-side area.
- Blueprint Finder quality slider behavior and mining-resource color alignment.
- Language Pack spacing improvement.
- Event Planner export/layout fixes already present in the working build.

`sw.js` was updated only to bump the cache name so GitHub Pages users receive the new `index.html` instead of an old service-worker cached copy.
