<div align="center">

> **Visual preview update:** Event Planner, Commodity Trading, Vehicle Loadout Manager, and Game Status & Intelligence now include animated command-surface headers, module-specific symbols, telemetry chips, and enhanced active-tab states. All workflows and stored data remain unchanged.


# Celestial Nexus — Alliance Toolkit

### Star Citizen operations, FPS force planning, logistics, intelligence, engineering, and organization coordination

![Release](https://img.shields.io/badge/release-v1.3.7-38bdf8?style=for-the-badge)
![Edition](https://img.shields.io/badge/edition-FPS%20Unit%20Force%20Templates-14b8a6?style=for-the-badge)
![Hosting](https://img.shields.io/badge/hosting-GitHub%20Pages-111827?style=for-the-badge&logo=github)
![Build](https://img.shields.io/badge/build-static%20PWA-6366f1?style=for-the-badge)

**Created by Elusyon for Celestial Alliance**

</div>

---

### Guaranteed Vehicle Loadout Manager covers

Vehicle Loadout Manager now displays an offline-safe engineering cover for every selected vehicle. When verified Star Citizen artwork is available, it replaces the generated cover automatically; when external media is unavailable or blocked, the selected ship or ground vehicle still receives a role-aware visual identity panel.

## About this repository

This repository is the complete, deployment-ready release of **Celestial Nexus v1.3.7 — FPS Unit Force Templates**. The application is a static browser toolkit: there is no Node.js build, package manager, database, server process, or secret configuration required.

The package is intentionally portable. Runtime references to the previous repository have been removed; the packaged roster and Wikelo artwork are loaded using paths relative to the new repository.

> [!IMPORTANT]
> This is an unofficial Star Citizen community project. It is not affiliated with, endorsed by, or sponsored by Cloud Imperium Games or Roberts Space Industries. Star Citizen, Squadron 42, associated marks, and third-party data remain the property of their respective owners.

## Quick start

1. Create a **new public GitHub repository** without adding GitHub's starter README, license, or `.gitignore`.
2. Extract this release ZIP.
3. Commit **the contents inside the extracted folder** to the new repository's `main` branch.
4. Open **Settings → Pages**.
5. Select **Deploy from a branch → main → /(root)** and save.
6. Wait for the generated **pages build and deployment** run to finish.

Detailed instructions: [`docs/NEW_REPOSITORY_SETUP.md`](./docs/NEW_REPOSITORY_SETUP.md)

## Included workspaces

| Workspace | Purpose |
|---|---|
| Alliance Tool Hub & Roster | Central navigation and organization roster snapshot/live synchronization |
| Event Planner | Operations, ship crews, FPS unit templates, assignments, rosters, and Discord briefings |
| Item Finder | Equipment, specifications, stores, prices, marketplace references, and item acquisition research |
| Blueprint Finder | Fabrication recipes, unlock paths, material requirements, and crafted-quality simulation |

### Finder interface design

The Item Finder uses an acquisition-first layout: the selected item remains visible at the top, while **Where to get this item** displays large shop cards, lowest reported price, terminal, and buy/sell values. Matching blueprint information is displayed beside it with larger unlock and recipe sections.

The independent Blueprint Finder gives acquisition sources and recipe materials full-width treatment before the quality simulator, making contracts, mission unlocks, quantities, and minimum-quality requirements easier to read.

| Vehicle Loadout Manager | Hardpoints, components, crafted quality, performance, and acquisition planning |
| Language Pack Lab | Patch-aware `global.ini` creation, component naming, and ASOP ordering |
| Game Status & Intelligence | RSI service health, LIVE build awareness, official news, and labeled community intel |
| Wikelo Trade Center | Trades, materials, shared projects, completability, and reputation planning |
| Org Picture Creator | Branded organization graphics, templates, reusable projects, and PNG export |
| Commodity Trading | Exchange-style commodity board, buy/sell terminal dossiers, market signals, trade routes, fuel planning, convoy briefs, and exports |
| Mining Resources Command | Industrial resource board, regional guidance, fracture planning, owned-platform optimization, and direct VLM loadout handoff |
### Commodity exchange design

Commodity Trading now opens on a complete exchange-style market board. The default view lists the available UEX commodity catalog, headline buy and sell observations, spread, ROI, freshness, coverage, and a clearly labeled comparison with reported averages. Selecting a commodity opens a larger dossier showing the cheapest purchase terminals, highest-paying sell terminals, stock or demand when reported, and a shortcut into the route finder. Existing trade-route, fuel-planning, convoy, market-pulse, and source-intelligence tabs remain available.

### Mining command and VLM handoff design

Mining Resources Command now follows a four-step field workflow: **Discover → Route → Evaluate → Configure**. The selected resource dossier gives regional confidence, resistance, instability, mass class, quality potential, and the recommended platform more visual priority. The Loadout tab presents a large engineering package with mining head/tool, installed modules, field support, and crew baseline.

Selecting **Open in Vehicle Loadout Manager** transfers the plan into VLM. The toolkit selects the matching manufacturer and vehicle, applies the vehicle search filter, loads its current hardpoint record, and attempts to match compatible mining heads and module slots. Integrated FPS tools and fixed ground-vehicle equipment remain visible as an advisory when VLM cannot expose an editable hardpoint. Live game/API records remain the final authority before saving a configuration.


Full workflows and controls: [`docs/MODULE_GUIDE.md`](./docs/MODULE_GUIDE.md)

## Repository map

```text
.
├── index.html
├── 404.html
├── manifest.webmanifest
├── sw.js
├── .nojekyll
├── icon-192.png
├── icon-512.png
├── icons/
├── assets/wikelo/
├── data/roster.json
├── docs/
├── scripts/
├── .github/ISSUE_TEMPLATE/
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── VERSION.txt
├── PACKAGE_REPORT.json
└── SHA256SUMS.txt
```

## Documentation

- [Create and publish the new repository](./docs/NEW_REPOSITORY_SETUP.md)
- [Module guide](./docs/MODULE_GUIDE.md)
- [Architecture and file responsibilities](./docs/ARCHITECTURE.md)
- [Deployment and post-deployment checks](./docs/DEPLOYMENT.md)
- [Local testing](./docs/LOCAL_TESTING.md)
- [Data, privacy, and browser storage](./docs/DATA_AND_PRIVACY.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [Release and maintenance process](./docs/RELEASE_PROCESS.md)
- [Third-party sources and packaged artwork](./docs/THIRD_PARTY_SOURCES.md)

## Browser support

A current release of Chrome, Edge, Firefox, or Safari is recommended. PWA installation and some export features vary by browser. For full behavior, use HTTPS or a local HTTP server rather than opening `index.html` with a `file://` URL.

## Important operational notes

- User-created plans and preferences are primarily stored in the browser.
- A new repository name creates a new website origin, so browser-local data from the previous Pages URL will not automatically transfer.
- Export important plans from the old deployment before switching links.
- Live data can be unavailable because of source outages, rate limits, CORS policy, or game-patch changes; the rest of the toolkit should remain usable.
- No API key or repository secret is included or required by this package.

## Integrity

Run the packaged validator before publishing:

```bash
python scripts/validate_package.py
```

The expected release inventory and SHA-256 hashes are recorded in `PACKAGE_REPORT.json` and `SHA256SUMS.txt`.

### Vehicle cover behavior

The Vehicle Loadout Manager displays the selected ship or ground vehicle in the large top hero. Verified artwork is used when available; an offline-safe engineering cover is generated immediately as a fallback. The same cover is synchronized to acquisition planning and image exports.

### Mission Finder

A current-patch contract intelligence workspace designed around SCMDB mission records. It supports full-text search, system/category/faction filters, release and gameplay flags, fixed aUEC payout ranges, item rewards, reputation gains and losses, blueprint pools, hauling orders, timing, locations, variants, requirements, raw-field inspection, snapshot import/export, and scheduled synchronization.

When the synchronized fallback contains a mission summary, selecting a contract now requests that mission’s complete Star Citizen Wiki API detail record and merges it into the dossier without discarding the synchronized source fields. Fixed payout values are shown when the source publishes an explicit amount such as SCMDB `rewardUEC` or Wiki API `reward_min` / `reward_max`; contracts without a published monetary amount are labelled **No fixed payout exposed** rather than incorrectly implying a UI failure. Every source field remains available in the raw record inspector. See `MISSION_FINDER_DATA_DISPLAY.md` for the field behavior and update workflow.


### Mission Finder 4.8.3 LIVE integrity


Mission Finder is now pinned to **4.8.3 LIVE**. The synchronizer examines SCMDB source URLs and metadata before accepting a mission array, rejects PTU and other patch families, and uses a version-scoped Wiki API fallback only after discovering an exact 4.8.3 LIVE game-version code. A patch-integrity strip in the UI shows the required dataset, loaded version, verification status, and snapshot freshness. The refreshed browser adds compensation filters and payout, reputation, duration, and alphabetical sorting.
