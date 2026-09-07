# Update Instructions — Celestial Nexus Toolkit v2.0.5

## 1. Apply the ZIP as a repository-root overlay

Extract the ZIP and copy **everything inside it over the root of your GitHub repository**. Preserve the folder structure and make sure the hidden `.github` folder is included.

The important replacements are:

- `index.html`
- `sw.js`
- `.github/workflows/sync-game-data.yml`
- `.github/workflows/validate-toolkit.yml`
- `scripts/sync-scmdb-missions.mjs`
- `scripts/test-data-resilience.mjs`
- `scripts/validate-toolkit.mjs`
- `scripts/validate-repo.mjs`

Commit and push the changes to your deployment branch (`main` in the current repository layout).

## 2. Run the toolkit validation workflow

Open **GitHub → Actions → CA Toolkit V 2.0.5** and run it manually once.

It should pass repository validation, pre-sync validation, and the regression suite including the `Reputation.DisplayName` faction-recovery fixture.

## 3. Run Sync game data

After validation passes, manually run **Sync game data**.

The workflow now:

1. tries exact SCMDB first;
2. if SCMDB is unavailable, sparse-checks out `StarCitizenWiki/scunpacked-data` `contracts` and `factions` folders;
3. loads the complete current Wiki mission catalog;
4. joins missions to raw contract relationships by UUID;
5. joins faction UUIDs to raw faction records;
6. resolves placeholder top-level faction names through `Reputation.DisplayName`.

## 4. Inspect the Actions summary

Check these values in the Sync workflow summary:

- **Source**
- **Game version**
- **Contracts**
- **Named factions**
- **Contracts without a resolved faction/issuer**
- ScDataDumper mission/faction match counts when the fallback is used

If SCMDB is healthy again, the source should automatically be SCMDB. During the current SCMDB outage, a Star Citizen Wiki + ScDataDumper relationship fallback is expected.

Do not judge success by a fixed mission number. The public 1,381-mission SCMDB client figure is only a comparison benchmark and can change between builds. The important check is that the sync loads the complete available catalog and does not collapse most contracts into an unresolved faction bucket.

## 5. Deploy and hard-refresh

Allow GitHub Pages to redeploy, then perform one hard refresh of the toolkit. v2.0.5 uses a new service-worker cache revision so the old v2.0.4 Contract Finder code should be replaced.

## 6. Verify the Faction / Giver picker

Open **Contract Finder → Faction / Giver**.

You should no longer see `No faction listed` as a selectable faction bucket. Source-backed factions such as **Foxwell Enforcement, Headhunters, Vaughn**, and other current issuers should populate when their current mission relationships are present.

If the workflow summary reports a large unresolved issuer count, do not treat that deployment as healthy; capture the Actions log because it means one of the upstream relationship sources changed schema or failed to download.
