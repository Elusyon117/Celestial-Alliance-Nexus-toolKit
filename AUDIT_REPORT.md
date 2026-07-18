# Celestial Alliance Nexus Toolkit — comprehensive audit

**Target release:** 1.8.0  
**Audit date:** 2026-07-18  
**Primary application reviewed:** uploaded `index.html` plus the public repository structure, workflows, generated-data metadata, local assets, and service-worker deployment model.

## Executive conclusion

The toolkit’s feature surface is present and the uploaded monolithic HTML is syntactically valid, but the repository had four high-impact operational risks:

1. The SCMDB one-time importer depends on a temporary GitHub release that does not currently exist.
2. GitHub-hosted runners receive HTTP 403 from SCMDB automatic discovery, so the release asset is not optional for the 4.9 import path.
3. The service worker’s previous broad precache design could make installation brittle and retain stale oversized caches.
4. The app still identified itself as 1.6.0 and contained duplicate DOM IDs, while the requested release is 1.8.0.

The clean package fixes these areas without rewriting working modules.

## Scope and methodology

- Reviewed public repository root, workflow directory, current workflow definitions, generated status metadata, roster metadata, and project documentation.
- Parsed the uploaded HTML as a document and extracted scripts/styles/IDs/local references.
- Syntax-checked every inline classic JavaScript block with Node.
- Performed an initial Chromium render of the uploaded document and inspected initial view state, heap use, console failures, and external dependency behavior.
- Verified the clean package’s required local files, JSON, workflow YAML, JavaScript syntax, duplicate IDs, and local markup references.

## Uploaded index metrics

| Metric | Result |
|---|---:|
| File size | 6,451,214 bytes |
| Lines | 53,071 |
| DOM tags | 3,504 |
| Script tags | 85 total; 84 inline |
| Inline JavaScript | 4,763,405 characters |
| Style tags | 95 |
| Inline CSS | 932,186 characters |
| DOM IDs | 691 |
| Images in markup | 22 |
| Estimated embedded base64 image payload | about 2.13 MB |
| `setInterval` calls | 6 |
| `setTimeout` calls | 160 |
| `requestAnimationFrame` calls | 35 |
| `MutationObserver` calls | 16 |
| Event listeners | 257 |
| `innerHTML` assignments | 279 |

All 84 inline classic JavaScript blocks passed syntax validation. This means the scan found no static parse failure, but it does not prove every interaction and every external API response is correct.

## Findings

### Critical / high

#### A-01 — SCMDB release asset precondition was not visible enough

The one-time workflow calls `gh release download`, but the repository currently reports no published releases. Therefore the workflow cannot download `merged-4.9.0-live.12232306.json` unless the user first creates the documented temporary prerelease.

**Fix:** a previously verified 4.9 snapshot now completes as an audited no-op. When no valid snapshot exists, the workflow uses an explicit release/asset preflight, exact filename check, actionable GitHub summary, strict JSON validation, and delayed cleanup.

#### A-02 — SCMDB automatic discovery is unreliable from Actions

Current generated status records HTTP 403 for `https://scmdb.net/data/versions.json`. The existing tracked snapshot can remain usable, but unattended sync cannot be assumed to refresh it.

**Fix:** the scheduled sync preserves the last verified snapshot on temporary upstream failure; the direct release-asset import remains strict and fails rather than silently accepting stale/unverified data.

#### A-03 — Generated-data integrity needed one consistent gate

Mission JSON, browser JS, status metadata, patch/channel identity, and counts could drift independently.

**Fix:** `audit-patch-data.mjs` validates schema, identity, counts, status, and patch references; workflows verify before committing.

### Medium

#### A-04 — Version drift

The uploaded page declared 1.6.0 in HTML metadata, title, release object, and release stamp.

**Fix:** normalized public release identifiers to 1.8.0.

#### A-05 — Duplicate DOM IDs

Two visual patch components each reused the same ID for a `<style>` and `<script>` element:

- `nexus-blueprint-component-symbol-visibility-patch`
- `nexus-blueprint-quality-slider-visual-patch`

Duplicate IDs can make `getElementById` select the wrong node.

**Fix:** script IDs now have a `-script` suffix.

#### A-06 — Service-worker installation and cache lifecycle

An all-at-once precache can fail when one optional asset is missing. Large generated data and language mirrors also make eager caching expensive.

**Fix:** shell assets are cached independently with `Promise.allSettled`; generated data is network-first runtime data; images are cache-first; old versioned caches are removed.

#### A-07 — GitHub Actions/runtime currency

One workflow still used older action versions, and previous runs displayed hosted-action runtime deprecation warnings.

**Fix:** workflows use `actions/checkout@v5`, `actions/setup-node@v5`, and Node 24 where Node is required.

#### A-08 — Monolithic page performance risk

A 6.45 MB HTML file with roughly 4.76 million inline JavaScript characters and many observers/timers is expensive to parse, compile, and maintain. The initial standalone Chromium render used about 23 MB of JavaScript heap before full external data was available.

**Fix in 1.8.0:** all 28 embedded base64 image literals were extracted into local version-controlled assets, reducing `index.html` from about 6.45 MB to about 3.60 MB (roughly 44% smaller). The package also adds conservative image decoding/lazy loading, hidden-view containment, resilient caches, and diagnostics.  
**Long-term recommendation:** split stable module code/data into versioned external bundles. That is a future architecture project, not a safe patch release change.

### Low / informational

#### A-09 — Dynamic ID references

Static analysis found many literal `getElementById` references whose targets are not in the initial HTML. Review showed the application frequently creates those controls dynamically. They should not be treated as proven missing elements without an interaction-specific runtime failure.

#### A-10 — External services remain environmental dependencies

Fonts, SCMDB, Star Citizen Wiki, Reddit, GitHub release APIs, and other remote sources can be blocked by DNS, CORS, rate limits, or provider changes. The toolkit includes fallbacks, but no static repository can guarantee those providers.

#### A-11 — Repository clutter

Old patch files and preview images are not required by the deployed toolkit and make a clean replacement harder to understand.

**Fix:** omitted them and documented the deletion set.

## Clean-package validation result

The final clean tree passed the included validator: 1.8.0 metadata, inline JavaScript syntax, static DOM ID uniqueness, required files, JSON parsing, and literal local-reference resolution. The SCMDB normalizer was also tested against a synthetic 4.9.0 LIVE dataset with 150 mission records; it produced consistent JSON, JS, status, and audit outputs.

## Feature review result

All major module containers were found in the uploaded index, and all inline scripts parse. No entire listed module was absent. The clean package retains the uploaded feature implementation rather than replacing it with a partial rewrite.

Modules dependent on generated or remote data need post-deployment verification:

- Contract Finder requires a verified mission snapshot.
- Language Lab requires either the repository mirror or its upstream fallback.
- Roster-driven planner behavior requires `data/roster.json`.
- External intelligence/search feeds require network access.

## Browser smoke-test limitation

A full click-through test against GitHub Pages was not possible inside the isolated build environment: external DNS calls failed and local browser navigation was restricted. The initial document did render and expose the hub; console errors in that isolated run were primarily storage-origin and unavailable-external-resource errors. Therefore the package includes an automated static validation workflow and a concrete deployed-browser checklist rather than claiming every remote interaction was exercised.

## Required post-install sequence

1. Push the clean package.
2. Run **Validate toolkit**.
3. Create the exact SCMDB temporary prerelease and run the import workflow.
4. Run the MrKraken sync workflow.
5. Wait for Pages deployment.
6. Complete the browser checklist in TESTING.md.

## Residual risks

- SCMDB can continue blocking GitHub runners; manual release-asset import is the supported recovery path.
- The all-in-one index remains large and carries long-term maintainability/performance cost.
- Third-party schemas can change and may require adapter updates.
- Generated third-party datasets are intentionally not fabricated in the clean ZIP.
