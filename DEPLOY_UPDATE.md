# Celestial Nexus Toolkit v1.9.1-r3 repository overlay

This ZIP contains only the files that must be replaced or added. It is not a full repository clone.

## Replace or add

Copy these paths into the repository root, preserving their folders:

- `index.html`
- `sw.js`
- `manifest.webmanifest`
- `release.json`
- `README.md`
- `scripts/validate-repo.mjs`
- `scripts/audit-patch-data.mjs`
- `docs/RELEASE_NOTES_v1.9.1-r3.md`
- `docs/HOTFIX_VALIDATION.md`

`SHA256SUMS.txt` and this file are deployment references and may also be committed.

## Do not delete

Keep the repository’s existing:

- `assets/`
- `data/`
- `.github/workflows/`
- `icons/`
- `404.html`
- all generated SCMDB, roster, game-status, price, and MrKraken mirrors

## Suggested Git commands

```bash
git checkout -b fix/v1.9.1-r3-integrity
unzip -o Celestial-Nexus-Toolkit-v1.9.1-r3-integrity-hotfix.zip -d .
git add index.html sw.js manifest.webmanifest release.json README.md \
  scripts/validate-repo.mjs scripts/audit-patch-data.mjs \
  docs/RELEASE_NOTES_v1.9.1-r3.md docs/HOTFIX_VALIDATION.md \
  DEPLOY_UPDATE.md SHA256SUMS.txt
git commit -m "Fix toolkit validation and VLM component loading"
git push -u origin fix/v1.9.1-r3-integrity
```

## Validation

Run locally when Node.js is available:

```bash
node scripts/validate-repo.mjs
STRICT_AUDIT=1 node scripts/audit-patch-data.mjs
```

Then run the repository’s **Validate toolkit** GitHub Action.

## Deployment verification

1. Wait for GitHub Pages to finish deploying.
2. Open the site in a private/incognito window.
3. In DevTools → Application → Service Workers, verify the active worker uses `1.9.1-r3`.
4. Open Vehicle Loadout Manager and choose a vehicle.
5. Open shields, power, cooling, quantum, radar, mining, salvage, and tractor component pickers as applicable.
6. Confirm each picker displays stock/cached choices immediately and then reports either “Live catalog ready” or a usable fallback warning.
7. Select a replacement component, close the picker, reopen it, and confirm the selection remains.
8. Test save/restore, export/import, Contract Finder, Language Pack, and Game Status once.

## Cache note

The visible application version remains `1.9.1`. The cache revision is `1.9.1-r3`; this separation is intentional.
