SCMDB SYNC RESTORATION
======================

Replace exactly these two files in the repository:

1. scripts/sync-scmdb-missions.mjs
2. .github/workflows/sync-scmdb-missions.yml

Do not create SCMDB_MISSIONS_URL. This restoration reads SCMDB's public
/data/versions.json manifest and automatically selects the newest 4.8.3 LIVE
merged dataset, including 4.8.3-live.12122953 when it is the newest match.

After replacement, commit both files and run:
Actions -> Sync SCMDB mission data -> Run workflow

Also verify:
Settings -> Actions -> General -> Workflow permissions -> Read and write permissions
