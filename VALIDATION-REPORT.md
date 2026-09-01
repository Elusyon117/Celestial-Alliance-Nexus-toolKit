# Celestial Nexus LIVE-standardization validation report

Packaging date: 2026-09-01
Baseline inspected: uploaded Celestial Nexus Toolkit v2.0.1 `index.html`
Current bootstrap: Star Citizen `4.10.0-LIVE.12519617`

## Structural regression checks

The final `index.html` was compared with the uploaded v2.0.1 HTML after all LIVE-standardization changes.

- Module views: **16 → 16**, no original view removed.
- Element IDs: **953 → 957**, **0 original IDs removed**. Four IDs were added for the shared LIVE authority/build guards.
- Buttons: **245 → 245**.
- Inputs: **111 → 111**.
- Selects: **75 → 75**.
- Textareas: **5 → 5**.
- Links: **49 → 49**.
- Original module views retained: Hub, Commodity Trading, Studio, Contract Finder, Wikelo, Vehicle Loadout, FPS Loadout, Game Health, Item Finder, Blueprint Finder, Pyro Hangar Watch, Language Pack, Mining, Event Planner, Cargo Routing, Cargo Grid.

This is a structural regression check: it verifies that the patch did not delete the existing controls/views/IDs relied on by the toolkit.

## JavaScript / workflow checks

- **161 inline executable JavaScript blocks** in final `index.html`: `node --check` passed for every block.
- `sw.js`: `node --check` passed.
- `scripts/resolve-live-build.mjs`: `node --check` passed.
- `scripts/verify-live-data.mjs`: `node --check` passed.
- `scripts/normalize-contract-payouts.mjs`: `node --check` passed.
- Replacement `sync-game-data.yml`: YAML parsing passed; `sync` job is present.
- Verification-policy dry run using a simulated verified `4.10.0-LIVE.12519617` Contract Finder snapshot passed **all 18 current-LIVE guard checks** in strict mode.

## LIVE-data guard checks passed

The strict policy verifies that the final browser build contains all of the following protections:

- shared LIVE authority;
- hub LIVE-build label;
- exact Wiki game-version pinning;
- shared UEX current-version gate;
- Contract Finder payout aliases and no-fabrication state;
- current-LIVE-only Wikelo active records;
- historical vehicle price fallback retired;
- historical cargo-capacity fallback retired;
- Item Finder demo gameplay fallback retired;
- historical Mining patch baseline retired from current-data claims;
- old 4.8.3 mission-detail pin retired;
- old 4.9 Trade tab label retired;
- direct Commodity Trading Wiki/UEX calls standardized;
- FPS demo gameplay fallback retired;
- FPS module uses the shared LIVE authority;
- historical Teach special-edition hardpoint override retired;
- common module build badges present;
- service worker revision and registration synchronized.

## Stale-version scan

Active 4.8/4.9 game-build fallback signatures were searched after the final changes. Remaining `Alpha 4.9` strings in `index.html` are two dated official news-history entries; they are not used as calculations, prices, loadouts, capacities, payouts, recipes, or current-build authority.

The final main workflow and new helper scripts contain no active 4.8/4.9 synchronization target.

## Contract Finder payout behavior

The new normalizer canonicalizes only source-provided reward aliases. It does not infer or invent aUEC. Contracts with exposed item/blueprint/reputation compensation can be represented as non-currency rewards. Coverage statistics are written to `data/game-data-status.json` by the scheduled sync.

## Workflow preservation

The replacement main workflow retains the current repository workflow's existing trigger/channel/schedule/permissions/concurrency/sync/audit/commit/issue-reporting responsibilities and adds LIVE resolution, payout normalization, and strict verification. PTU/EPTU manual runs bypass LIVE-only enforcement.

The separate MrKraken language-pack workflow is intentionally not bundled or overwritten. The only workflow marked for deletion is the historical `sync-scmdb-4.9-once.yml`, which is hard-coded to 4.9.

## Important limitation

The local packaging environment cannot execute a full production browser session against every third-party API endpoint, so this report is not a claim that external providers will never change their schemas or CORS behavior. Instead, the update is designed to **fail closed** for patch-sensitive gameplay data: if current LIVE cannot be verified, the affected value/catalog is shown as unavailable rather than replaced by an old-patch number.

Planning-only data that is inherently curated (for example some Mining recommendations and Pyro timer presets) remains available but is explicitly treated/labeled as heuristic or community planning information rather than authoritative build-pinned gameplay data.
