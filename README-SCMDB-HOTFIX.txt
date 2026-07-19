SCMDB CONTRACT IMPORT HOTFIX
============================

Replace these two files in the repository:

  .github/workflows/sync-scmdb-4.9-once.yml
  scripts/recover-scmdb-from-history.mjs

Then commit and push the changes. In GitHub, open Actions and run:

  Restore or sync SCMDB 4.9 contracts

What changed:
- The workflow no longer requires a temporary GitHub release.
- It first accepts an already valid tracked snapshot.
- If the current files are v1.8.0 bootstrap placeholders, it recovers the newest
  verified 4.9.0 LIVE mission snapshot from the repository's full Git history.
- If history has no valid snapshot, it attempts the direct SCMDB 4.9 LIVE asset.
- It audits, verifies, commits, and pushes the recovered data automatically.

Do not delete the repository's Git history. GitHub keeps that history when files
are replaced through normal commits, so the recovery path should work for the
current repository.
