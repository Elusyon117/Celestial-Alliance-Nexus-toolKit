# Release and Maintenance Process

## Before editing

1. Create a branch for the change.
2. Keep a copy or tag of the last production release.
3. Export any browser-local test data that matters.

## Version locations

For a release, review and update:

- `<html data-nexus-version>` in `index.html`.
- `<title>` and visible release labels in `index.html`.
- `VERSION.txt`.
- `CHANGELOG.md`.
- `CACHE_NAME` in `sw.js`.
- `PACKAGE_REPORT.json` and `SHA256SUMS.txt`.

## Required tests

- Run `python scripts/validate_package.py`.
- Serve over local HTTP.
- Smoke-test all modules.
- Test desktop and mobile widths.
- Test a clean private-window load.
- Test one installed-PWA update.
- Confirm third-party failures are nonfatal.

## Publishing

Merge or commit the tested release to `main`. Wait for the Pages run to finish. Do not delete the previous release tag until the new site has passed post-deployment verification.

## Rollback

Prefer a normal restore commit that makes `main` match a known-good tag or commit. Preserve the failed/newer state on a backup branch before restoring production.
