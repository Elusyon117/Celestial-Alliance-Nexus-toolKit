# Import SCMDB 4.9 from a GitHub release asset

The SCMDB public endpoint has returned HTTP 403 to GitHub-hosted runners. The import workflow therefore reads a user-uploaded temporary GitHub release asset.

## Existing verified snapshot behavior

If the repository already contains a verified 4.9.0 LIVE snapshot with at least 100 missions, the workflow now audits it and completes successfully without requiring a temporary release. This prevents repeated runs from failing after the one-time asset has already been imported.

## Required source file

Download this file manually in a normal browser:

`https://scmdb.net/data/merged-4.9.0-live.12232306.json`

Do not rename it unless you also change the workflow input.

## Create the temporary release

1. In the repository, open **Releases**.
2. Choose **Draft a new release**.
3. Create the tag `scmdb-4.9-import`.
4. Mark it as a prerelease.
5. Upload the exact file `merged-4.9.0-live.12232306.json`.
6. Publish the prerelease.

## Run the workflow

1. Open **Actions**.
2. Select **Import SCMDB 4.9 from release asset**.
3. Choose **Run workflow**.
4. Keep the defaults unless the release tag or filename differs.
5. Keep **cleanup_release** enabled if the temporary release should be deleted after success.

## What the workflow now checks

- The release tag exists.
- The exact asset exists before any import step starts.
- The asset is non-empty and valid JSON.
- The dataset identifies as patch 4.9.0, channel LIVE.
- A plausible mission collection is found recursively.
- At least 100 active mission records exist.
- JSON, browser JS, status, and audit files agree on patch/channel/count.
- Changes commit and push successfully before cleanup begins.

The release cleanup is non-fatal and runs only after a successful import. A cleanup permission problem can no longer invalidate an otherwise successful data import.

## Why the old workflow could stop

The repository currently reports no published releases, while this workflow requires a release tag and exact asset. Without the temporary prerelease, `gh release download` cannot complete. The public SCMDB versions endpoint has also returned 403 from GitHub runners, so automatic live discovery is not a reliable substitute for this one-time import.
