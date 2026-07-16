# Celestial Nexus latest-patch update package

## Install

From the repository root:

1. Replace `index.html` with the packaged `index.html`.
2. Replace `scripts/sync-scmdb-missions.mjs`.
3. Add `scripts/audit-patch-data.mjs`.
4. Delete `.github/workflows/sync-scmdb-missions.yml`.
5. Add `.github/workflows/sync-game-data.yml`.
6. Commit and push the changes.
7. In GitHub, open **Actions → Sync game data → Run workflow**. Leave **patch** blank and choose **LIVE**.

The packaged `index-latest-live.patch` is an alternative to replacing the full `index.html`:

```bash
git apply index-latest-live.patch
```

## What the workflow does

- Runs every six hours and can also be run manually.
- Reads SCMDB's versions manifest and selects the newest dataset for the chosen channel.
- Chooses the newest build within that patch.
- Supports an optional `MISSION_PATCH` override for deliberate historical or emergency pins.
- Cross-checks the downloaded dataset's patch and channel before writing files.
- Rejects very small datasets and suspicious contract-count drops.
- Writes `data/scmdb-missions-live.json`, `data/scmdb-missions-live.js`, and `data/game-data-status.json`.
- Audits the rest of `index.html` for older patch-specific values and writes `data/patch-audit.json`.
- Opens or updates a GitHub issue when curated modules need review, or when synchronization fails.

## Important boundary

The Contract Finder has a trusted machine-readable upstream, so it can be synchronized automatically. Other embedded datasets—such as curated Wikelo recipes, terminal snapshots, or preview balance tables—must get their own source adapter and validation rules before they should be auto-rewritten. The audit report identifies those references without relabeling old data as new.

## Optional controls

- `MISSION_CHANNEL=LIVE|PTU|EPTU`
- `MISSION_PATCH=4.9` to temporarily pin a patch; blank means newest patch in the channel.
- `SCMDB_MISSIONS_URL=https://.../4.9-LIVE.12345678.json` for an explicit emergency source.
- `MISSION_MIN_ACTIVE=100` to change the minimum accepted active-contract count.
- `ALLOW_LARGE_DROP=true` only after manually reviewing a legitimate large dataset reduction.
