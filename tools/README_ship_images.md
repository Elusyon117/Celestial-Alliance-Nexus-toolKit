# Ship image assets

`assets/images/ships/ship-image-manifest.json` maps ship names used across VLM, Event Planner, Cargo/Trade, Wikelo, and related modules to local files.

This package includes real localized artwork where it was already bundled, and generated local covers for the rest of the catalog. Generated covers are intentionally lightweight and keep the toolkit from contacting remote image hosts just to show a ship card.

If you later want to replace generated covers with official/wiki thumbnails, keep the same filenames or update the manifest name_map.
