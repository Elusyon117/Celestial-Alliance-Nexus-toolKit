# Publish the v1.9.0 incremental update

The repository inspected on 2026-07-24 identifies itself as v1.8.0 and already contains workflows, generated-data folders, documentation, icons, a service worker, and extracted assets. This ZIP is intentionally an **incremental overlay**, not a destructive full-repository replacement.

1. Create a backup branch or tag from the current `main` branch.
2. Extract this ZIP directly into the repository root.
3. Allow it to overwrite `index.html`, `sw.js`, and `VERSION.txt`.
4. Confirm that these new files exist:
   - `assets/images/hub/day12-topbanner-bengalfleet-min.jpg`
   - `assets/images/cargo-grid/josh-van-zuylen-logistics22.jpg`
   - `assets/images/modules/argo-raft-cargo-grid-manager.webp`
5. Keep the repository's existing `.github`, `data`, `docs`, `icons`, scripts, manifest, and other assets.
6. Commit and push to `main`.
7. Run the repository's data-sync/validation workflows as normally required.
8. After GitHub Pages redeploys, hard-refresh once. The service-worker version changed to 1.9.0, so old 1.8.0 caches will be removed during activation.

Suggested commit message:

```text
Release v1.9.0: Cargo Grid Manager and cargo routing fixes
```
