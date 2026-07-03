## Mission Finder payout and complete-detail upgrade — 2026-07-02

- Replaced the ambiguous “Reward varies” label with explicit source-aware payout states.
- Added prominent fixed aUEC payout, reputation gained/lost, item reward, blueprint, cargo, duration, lifetime, cooldown, player, and rank summaries.
- Added on-demand loading of the selected mission’s complete API detail record, including reward groups, reputation losses, hauling orders, starmap locations, prerequisite groups, unlock groups, and completion tags.
- Added complete location-group displays with expandable long lists.
- Added separate compensation, reputation, hauling, geography, access, operational, and progression sections.
- Explicitly requests ungrouped mission variants during browser and scheduled synchronization.
- Preserved all synchronized and imported raw fields and retained SCMDB-first source behavior.

## Mission Finder preview

- Added Mission Finder as the eleventh toolkit module.
- Added SCMDB-first mission snapshot discovery and scheduled synchronization.
- Added complete raw-field preservation and inspection.
- Added filters for system, category, faction, legality, release state, blueprints, combat, hauling, sharing, prison availability, prerequisites, and chains.
- Added detailed contract briefing, rewards, reputation, blueprints, cargo, variants, import/export, and source-status views.
- Added a clearly labelled Star Citizen Wiki API fallback when SCMDB data is unavailable.

## VLM visible cover hotfix

- Replaced the fragile full-bleed VLM hero artwork with a dedicated right-side cover panel.
- The panel mirrors the already-working shopping-list vehicle image and is independent of the old hidden hero image layer.
- Added mutation and timed synchronization so the selected vehicle cover appears after every vehicle load.
## Unreleased — Guaranteed VLM vehicle covers

## VLM vehicle cover visibility correction

- Replaced the fragile full-bleed hero artwork layer with a dedicated, high-contrast vehicle media panel.
- The selected ship or ground vehicle is now rendered at full brightness with `object-fit: contain`, preventing crop loss and dark-overlay concealment.
- Added responsive desktop and mobile cover layouts while preserving generated fallback covers, verified artwork lookup, shopping banners, exports, and Mining-to-VLM handoffs.



## VLM hero cover visibility fix

- Corrected the top Vehicle Loadout Manager hero stacking order so selected-vehicle artwork is visible above the hero background.
- Preserved the verified remote artwork upgrade and offline-safe generated engineering cover.
- Kept the cover vignette, title overlay, shopping banner synchronization, exports, and Mining-to-VLM handoff unchanged.

- Added an offline-safe generated engineering cover for every selected ship and ground vehicle.
- Verified remote vehicle artwork still replaces the generated cover automatically when available.
- Added role-aware silhouettes for fighters, cargo ships, mining craft, explorers, capital ships, and ground vehicles.
- Kept Vehicle Loadout Manager selection, hardpoints, exports, shopping routes, and Mining handoff behavior unchanged.

## Modern Mining Command + Vehicle Loadout Manager handoff — 2026-07-02

- Rebuilt Mining Resources Command as a cleaner industrial intelligence workspace with a mission-control hero, four-step planning flow, clearer filters, and a larger resource dossier.
- Enlarged regional routing, fracture planning, loadout guidance, and owned-platform recommendations for faster field decisions.
- Added a prominent recommended engineering package with vehicle, mining head, module, support, and crew guidance.
- Added direct Mining-to-VLM handoff: the recommended vehicle and manufacturer filters are selected automatically, then compatible mining heads and module slots are matched when live hardpoint records expose editable options.
- Added a handoff status panel in Vehicle Loadout Manager and a return path to the originating mining recommendation.
- Preserved the existing resource catalog, favorites, checklists, operation briefing, owned-platform advisor, and patch-sensitive guidance.

## Commodity Exchange UI revamp — 2026-07-02

- Made Market Exchange the default Commodity Trading tab.
- Added an exchange-style board covering the available UEX commodity catalog.
- Added searchable and sortable buy-low, sell-high, spread, ROI, freshness, coverage, and average-comparison signals.
- Added a commodity dossier with larger Where to Buy and Where to Sell terminal lists.
- Added reported stock/demand, market briefs, opportunity tape, and direct handoff to Trade Routes.
- Preserved route filtering, Alpha 4.9 fuel planning, market pulse, convoy board, imports, exports, and data-source documentation.

## Separated Item and Blueprint modules — 2026-07-02

- Split the former combined Item/Blueprint workspace into two independent home-page modules.
- Added a dedicated animated Blueprint Finder card and `#blueprints` route.
- Preserved direct item-to-blueprint recipe links and all existing finder functionality.
- Updated the home dashboard from nine to ten active modules.
- Added independent Item Finder and Blueprint Finder navigation and documentation.

## Home module-card motion refresh — 2026-07-02

- Added visible continuous motion to all nine command-module cards.
- Added scanner passes, flowing telemetry strokes, pulsing nodes, orbiting icon beacons, and staggered lighting.
- Added pointer-responsive 3D tilt and cursor-following illumination for desktop devices.
- Preserved reduced-motion accessibility and all existing module behavior.

# Changelog

## Finder UI revamp — 2026-07-02

- Rebuilt Item Finder around a clearer acquisition-first information hierarchy.
- Replaced the compact shop table with larger location cards, lowest-price summary metrics, and prominent buy/sell values.
- Enlarged item blueprint matches and placed unlock sources before recipe materials.
- Expanded Blueprint Finder recipe, acquisition, material, and quality-lab presentation for faster scanning.
- Preserved all existing API sources, routes, filters, external links, and item-to-blueprint navigation.


## Unreleased — Lively module command surfaces

- Added animated command-surface headers to Event Planner, Commodity Trading, Vehicle Loadout Manager, and Game Status & Intelligence.
- Added module-specific symbols, telemetry chips, orbit effects, scan accents, and active-tab illumination.
- Preserved all existing controls, IDs, data sources, and module workflows.
- Added reduced-motion support for the new visual effects.


## v1.3.7 — Modern Home Preview

- Reorganized the landing page into a command overview, organization rail, and responsive module directory.
- Replaced emoji module markers with consistent inline interface symbols.
- Added an expansion-ready auto-fit grid for future modules.
- Compacted roster, creator, and source acknowledgements to make better use of wide displays.
- Preserved all existing module buttons, IDs, data sources, and application workflows.

## 1.3.7 — New repository package — 2026-07-02

- Packaged the FPS Unit Force Templates build as a clean GitHub Pages repository.
- Preserved the uploaded 1.3.7 application as `index.html`.
- Removed absolute fallback dependencies on the previous repository.
- Added portable relative roster and Wikelo asset references.
- Added PWA manifest, service worker, icons, `.nojekyll`, and a project-site-aware 404 page.
- Added complete repository, module, deployment, architecture, privacy, testing, troubleshooting, source, contribution, security, and release documentation.
- Added issue templates and local validation/serving scripts.
