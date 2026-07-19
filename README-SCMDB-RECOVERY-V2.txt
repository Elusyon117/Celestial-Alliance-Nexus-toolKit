Celestial Nexus v1.8.0 — SCMDB Recovery Audit Hotfix v2

Replace these two repository files:
  .github/workflows/sync-scmdb-4.9-once.yml
  scripts/recover-scmdb-from-history.mjs

Why the previous recovery run failed:
  The historical 4.9 LIVE payload was recovered successfully, but it predated
  the v1.8.0 strict schema audit and did not have normalized missionCount/meta
  fields. The workflow therefore stopped during Audit patch-sensitive data
  before it could commit the 1,778 recovered missions.

What this hotfix changes:
  - Normalizes recovered historical payload metadata before strict audit.
  - Sets missionCount to the actual mission array length.
  - Preserves historical active/legacy counts when available.
  - Synchronizes JSON, browser JS, status, and audit files.
  - Prints the full audit report in the GitHub Actions summary on failure.
  - Commits the recovered files to main after validation.

After uploading and committing the files:
  Actions > Restore or sync SCMDB 4.9 contracts > Run workflow

Expected result:
  A green workflow and a new bot commit named:
  Restore verified SCMDB 4.9 LIVE contracts
