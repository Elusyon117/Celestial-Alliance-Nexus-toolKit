# Celestial Nexus Toolkit v1.9.1-r2 repository update

This ZIP is an overlay for the existing repository. It intentionally does not duplicate unchanged assets, generated data, icons, workflows, or documentation.

## Files to replace or add

- Replace repository-root `index.html` with the included `index.html`.
- Replace repository-root `sw.js` with the included `sw.js`.
- Add `docs/RELEASE_NOTES_v1.9.1-r2.md` if you want the review history tracked in the repository.

## Do not delete

Keep the repository's existing:

- `assets/`
- `data/`
- `.github/workflows/`
- `icons/`
- `manifest.webmanifest`
- `404.html`
- generated SCMDB and MrKraken mirrors

## Suggested Git workflow

```bash
git checkout -b release/v1.9.1-r2
unzip -o Celestial-Nexus-Toolkit-v1.9.1-r2-repo-update.zip -d .
git add index.html sw.js docs/RELEASE_NOTES_v1.9.1-r2.md
git commit -m "Release Celestial Nexus Toolkit v1.9.1-r2"
git push -u origin release/v1.9.1-r2
```

Run the repository validation workflow before merging.

## Deployment check

After GitHub Pages redeploys:

1. Open the site in a private/incognito window.
2. Confirm the hub and all modules open.
3. In DevTools > Application > Service Workers, confirm `sw.js?v=1.9.1-r2` is active.
4. Verify Contract Finder data, Language Pack source sync, Game Status, Vehicle Manager, and FPS Loadout remote requests.
5. Test one save/restore, one export, and one import workflow.

The cache revision is deliberately separate from the visible application version. The app remains v1.9.1, while `r2` forces clients to discard the previous service-worker cache generation.
