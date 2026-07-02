# Mission Finder synchronization setup

The workflow file must exist on the default branch at:

```text
.github/workflows/sync-scmdb-missions.yml
```

GitHub only lists workflow files stored in `.github/workflows`. The `.github` directory is hidden on Windows, so browser uploads can accidentally omit it.

## Install

Upload these paths without adding an outer folder:

```text
.github/workflows/sync-scmdb-missions.yml
scripts/sync-scmdb-missions.mjs
index.html
```

The existing `data/scmdb-missions-live.json` and `.js` files must also remain in the repository.

## Run

1. Open **Actions**.
2. Select **Sync SCMDB mission data**.
3. Select **Run workflow**.
4. Run it on `main`.

The workflow first attempts SCMDB. When SCMDB is unavailable, it downloads every paginated mission record from the current Star Citizen Wiki mission API and labels the snapshot as a fallback. It then commits the updated JSON and JavaScript snapshot to the repository.

## Permissions

If the workflow can read data but cannot commit it, open:

**Settings → Actions → General → Workflow permissions**

Select **Read and write permissions**, then save.

## Optional exact SCMDB endpoint

When SCMDB publishes a stable mission JSON endpoint, create this repository variable:

```text
SCMDB_MISSIONS_URL
```

under **Settings → Secrets and variables → Actions → Variables**.
