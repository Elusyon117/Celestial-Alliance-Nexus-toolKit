<div align="center">

# Celestial Nexus — Alliance Toolkit

### Star Citizen operations, FPS force planning, logistics, intelligence, engineering, and organization coordination

![Release](https://img.shields.io/badge/release-v1.3.7-38bdf8?style=for-the-badge)
![Edition](https://img.shields.io/badge/edition-FPS%20Unit%20Force%20Templates-14b8a6?style=for-the-badge)
![Hosting](https://img.shields.io/badge/hosting-GitHub%20Pages-111827?style=for-the-badge&logo=github)
![Build](https://img.shields.io/badge/build-static%20PWA-6366f1?style=for-the-badge)

**Created by Elusyon for Celestial Alliance**

</div>

---

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
| Item Finder | Equipment, stores, prices, marketplace references, and blueprint research |
| Vehicle Loadout Manager | Hardpoints, components, crafted quality, performance, and acquisition planning |
| Language Pack Lab | Patch-aware `global.ini` creation, component naming, and ASOP ordering |
| Game Status & Intelligence | RSI service health, LIVE build awareness, official news, and labeled community intel |
| Wikelo Trade Center | Trades, materials, shared projects, completability, and reputation planning |
| Org Picture Creator | Branded organization graphics, templates, reusable projects, and PNG export |
| Commodity Trading | Market routes, cargo/capital sizing, confidence, fuel planning, convoy briefs, and exports |
| Mining Resources Command | Resource search, regional guidance, break planning, platform preparation, and operation briefs |

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
