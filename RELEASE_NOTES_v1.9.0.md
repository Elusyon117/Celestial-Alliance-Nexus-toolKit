# Celestial Alliance Nexus Toolkit v1.9.0 — Cargo & Routing Update

This incremental package updates the public v1.8.0 repository build to the toolkit developed through V20 while preserving the repository's existing workflows, data mirrors, documentation, icons, and third-party assets.

## Major additions

- Added **Cargo Grid Manager (NX-07-2)** as a companion to Cargo Hauling Routing.
- Added ship cargo-hold schematics, manual manifests, route transfer, contract colors, exact container mixes, auto-pack, free-look camera, top/side/front/isometric views, and image export.
- Added physical pointer-following crate drag and drop, improved hit testing, grid snapping, stacking support, collision prevention, undo/redo, rotation, and unplace/reset controls.
- Added standalone ship selection, usable-capacity editing, cargo-line creation, contract deletion, destination assignment, and exact 32/24/16/8/4/2/1 SCU crate counts.

## Cargo Hauling Routing fixes

- Replaced modal onboarding prompts with a persistent route-setup checklist.
- Kept player current location separate from each contract's pickup location.
- Corrected synced and manual contract origins, destinations, commodity, payout, per-hand-in SCU, and total cargo parsing.
- Corrected pickup preview cards so they follow the contract origin rather than the player's starting location.
- Preserved multiple delivery points and multiple commodity groups without duplicating payout.

## Vehicle upgrade shopping fixes

- Corrected closest-versus-cheapest seller selection for components and weapons.
- Ensured the selected route seller is used in shopping rows, copied checklists, CSV, and image exports.
- Improved seller/version handling and comprehensive UEX price lookup fallback behavior.

## Interface and media changes

- Tooltips remain on the main hub only and are removed from module workspaces.
- Cargo Grid Manager identifier changed to **NX-07-2**.
- Cargo Grid module card uses the RAFT cargo artwork.
- Main toolkit hero uses the original **7680 × 3292** Bengal fleet image without recompression.
- Cargo Grid banner uses the logistics artwork at full brightness.
- Hub status corrected to **14 modules online**.

## Repository packaging

- New user-supplied artwork is stored as local files under `assets/images/` rather than repeated base64 payloads.
- Service-worker caches are bumped to `1.9.0` and pre-cache the three new artwork files.
- The runtime API cache generation is bumped to avoid reusing stale v1.4.3 cache data.
